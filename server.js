(async () => {
    const { fork } = await import("child_process");
    const { WebSocketServer } = await import("ws");
    const { pack, unpack } = await import("msgpackr");
    const http = await import("http");


    const PROXIES = [
        "http://budget-v6.whiteproxies.com:27020"
    ];
    const prod = false;

    // HTTP SERVER
    const server = http.createServer((req, res) => {
        res.writeHead(426, { "Content-Type": "text/plain" });
        res.end("lll elk ez big fat noob");
    });


    // WS SERVER
    function randint(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    const sessions = new Map();
    const wss = new WebSocketServer({ server });

    // ── Centralized worker fork helper ─────────────────────────────────────
    // Creates a child process, wires up events, stores the spawn config for
    // re-forking on force respawn, and sends initial tank + start messages.
    function forkWorker(session, ws, packet, config, tankOverride) {
        const worker = fork("index.js", []);

        // Store config on worker so "K" (force respawn) can re-fork with same settings
        worker._spawnConfig = config;
        worker._spawnTank = tankOverride || session.tank;

        worker.on('exit', () => {
            session.workers = session.workers.filter(w => w !== worker);
            if (session.scanWorkers) session.scanWorkers = session.scanWorkers.filter(w => w !== worker);
        });
        worker.on('error', (err) => {
            // EPIPE / ECONNRESET are expected on Codespace teardowns
            if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
                console.warn(`Worker error (${err.code}), cleaning up.`);
            } else {
                console.error('Worker error:', err);
            }
        });
        worker.on('disconnect', () => {
            // Expected when worker exits or Codespace recycles — not fatal
        });

        worker.on("message", (msg) => {
            if (!ws || ws.readyState !== ws.OPEN) return;
            try {
                if (msg && msg.type === "report") {
                    packet("R", msg);
                } else if (msg && msg.type === "scanFound") {
                    packet("R", msg.report);
                    packet("X");
                }
            } catch (err) {
                console.warn('Forwarding worker message failed:', err.code || err.message);
            }
        });

        session.workers.push(worker);

        // Send tank selection
        if (worker.connected) {
            const tank = tankOverride || session.tank;
            try {
                worker.send({ type: "tankselect", tank: tank });
            } catch (_) {}
        }

        // Send start command
        try {
            if (worker.connected) {
                worker.send({ type: "start", config: config });
            }
        } catch (err) {
            console.warn('Worker start send failed:', err.code || err.message);
        }

        return worker;
    }

    wss.on("connection", (ws, req) => {
        const addr = req.socket.remoteAddress;
        console.log(addr, "connected");

        // Prevent unhandled WS errors from crashing the server (Codespace resilience)
        ws.on('error', (err) => {
            console.warn(`WebSocket error from ${addr}:`, err.code || err.message);
        });

        // Initialize or retrieve session for this IP
        if (!sessions.has(addr)) {
            sessions.set(addr, {
                workers: [],
                tank: "auto6",
                tanks: [],
                tankIdx: 0,
                proxyIdx: 0,
                swarmMode: "normal"
            });
        }
        const session = sessions.get(addr);

        let challenge;
        let verified = false;

        function packet(...args) {
            if (!ws || ws.readyState !== ws.OPEN) return;
            try {
                ws.send(pack(args));
            } catch (err) {
                if (err.code === 'EPIPE' || err.code === 'ERR_IPC_CHANNEL_CLOSED') {
                    console.warn(`WS send failed (${err.code}), client likely disconnected.`);
                } else {
                    console.error('WS send error:', err.code || err.message);
                }
            }
        }

        function safeWorkerSend(worker, message) {
            if (!worker || !worker.connected || worker.killed) return false;
            try {
                worker.send(message);
                return true;
            } catch (err) {
                // EPIPE / ERR_IPC_CHANNEL_CLOSED — common on Codespaces
                if (err.code === 'EPIPE' || err.code === 'ERR_IPC_CHANNEL_CLOSED' || err.code === 'ERR_IPC_DISCONNECTED') {
                    console.warn(`Worker IPC dead (${err.code}), removing worker.`);
                    session.workers = session.workers.filter(w => w !== worker);
                    try { worker.kill(); } catch (_) {}
                } else {
                    console.error("Worker send failed:", err.code || err.message);
                }
                return false;
            }
        }

        function close() {
            ws.close();
            // We only destroy workers if explicitly told to, or if the session is terminated.
            // For now, we don't destroy them on socket close to support refresh.
        }

        ws.on("message", (msg) => {
            try {
                const data = unpack(msg);
                const type = data.shift();

                switch (type) {
                    case "M":
                        if (challenge || data[0] != 72011) {
                            close();
                        }

                        challenge = randint(0b1000000000, 0b1111111111);
                        packet("M", challenge);
                        break;

                    case "C":
                        if (data[0] == (challenge ^ 845)) {
                            verified = true;
                            console.log(addr, "verified");
                        } else {
                            close();
                            console.log(addr, "true noob")
                        }

                        break;

                    case "Z":
                        session.tank = data[0];
                        if (session.tank instanceof Array) {
                            session.tanks = session.tank;
                            session.tankIdx = 0;

                            for (const worker of session.workers) {
                                if (worker.connected) {
                                    let t = session.tanks[session.tankIdx];
                                    safeWorkerSend(worker, { type: "tankselect", tank: t });

                                    session.tankIdx++;
                                    if (session.tankIdx >= session.tanks.length) {
                                        session.tankIdx = 0;
                                    }
                                }
                            }
                        } else {
                            session.tanks = [];
                            for (const worker of session.workers) {
                                if (worker.connected) safeWorkerSend(worker, { type: "tankselect", tank: session.tank });
                            }
                        }

                        break;

                    case "F":
                        if (verified) {
                            const hash = data[0];
                            const count = parseInt(data[1]) || 1;

                            console.log(`Spawning ${count} bots for hash: ${hash}`);

                            for (let i = 0; i < count; i++) {
                                setTimeout(() => {
                                    if (session.proxyIdx >= PROXIES.length) {
                                        session.proxyIdx = 0;
                                    }

                                    // Build the config for this worker (stored for re-fork on force respawn)
                                    let tankForWorker = session.tank;
                                    if (session.tanks.length) {
                                        tankForWorker = session.tanks[session.tankIdx];
                                        session.tankIdx++;
                                        if (session.tankIdx >= session.tanks.length) session.tankIdx = 0;
                                    }

                                    const workerConfig = {
                                        id: i,
                                        proxy: {
                                            type: "http",
                                            url: PROXIES[session.proxyIdx]
                                        },
                                        hash: "#" + hash,
                                        name: "[?>/7.]",
                                        stats: [0, 0, 0, 0, 0, 0, 0, 9],
                                        type: "follow",
                                        token: "follow-8fe6ca",
                                        autoFire: false,
                                        autoRespawn: true,
                                        keys: [],
                                        keysHold: [],
                                        tank: "Auto4",
                                        chatSpam: "",
                                        squadId: hash,
                                        reconnectAttempts: 3,
                                        reconnectDelay: 10000,
                                    };

                                    const worker = forkWorker(session, ws, packet, workerConfig, tankForWorker);
                                    session.proxyIdx++;
                                }, i * 15); // 15ms delay between each bot spawn (fast but Codespace-safe)
                            }
                        }

                        break;

                    case "B":
                        if (verified) {
                            for (const worker of session.workers) {
                                safeWorkerSend(worker, { type: "destroy" });
                            }
                            session.workers = [];
                        }

                        break;

                    case "K":
                        if (verified) {
                            console.log(`Force respawn ALL: destroying ${session.workers.length} workers and re-forking...`);
                            const workersToRespawn = [...session.workers];
                            session.workers = [];

                            // Kill all existing workers
                            for (const worker of workersToRespawn) {
                                const savedConfig = worker._spawnConfig;
                                const savedTank = worker._spawnTank;
                                try { worker.kill(); } catch (_) {}

                                // Re-fork with same config after a tiny stagger
                                if (savedConfig) {
                                    setTimeout(() => {
                                        const newWorker = forkWorker(session, ws, packet, savedConfig, savedTank);
                                    }, Math.random() * 200); // Small stagger to avoid thundering herd
                                }
                            }
                        }
                        break;

                    case "A":
                        if (verified) {
                            for (const worker of session.workers) {
                                if (worker.connected) {
                                    safeWorkerSend(worker, {
                                        type: "position",
                                        x: data[0],
                                        y: data[1],
                                        mouseX: data[2],
                                        mouseY: data[3],
                                        mouseDown: data[4],
                                        rMouseDown: data[5],
                                        mouse: data[6],
                                        feeding: data[7],
                                        shift: data[8],
                                        autofire: data[9],
                                        autospin: data[10],
                                        manualMode: data[11],
                                        manualX: data[12],
                                        manualY: data[13],
                                        overrideMode: data[14],
                                        sneakMode: data[15]
                                    });
                                }
                            }
                        }
                        break;
                    case "S":
                        if (verified) {
                            session.swarmMode = data[0] || "normal";
                        }
                        break;
                    case "Y":
                        if (verified) {
                            const hash = data[0];
                            const count = parseInt(data[1]) || 1;
                            const time = Math.max(1, parseInt(data[2]) || 5);
                            const team = data[3] || null;

                            console.log(`Team scan request: ${hash} x${count} time=${time} team=${team}`);

                            // Prepare scan workers list
                            session.scanWorkers = session.scanWorkers || [];

                            for (let i = 0; i < count; i++) {
                                setTimeout(() => {
                                    if (session.proxyIdx >= PROXIES.length) session.proxyIdx = 0;

                                    let tankForWorker = session.tank;
                                    if (session.tanks.length) {
                                        tankForWorker = session.tanks[session.tankIdx];
                                        session.tankIdx++;
                                        if (session.tankIdx >= session.tanks.length) session.tankIdx = 0;
                                    }

                                    const scanConfig = {
                                        id: i,
                                        proxy: {
                                            type: "http",
                                            url: PROXIES[session.proxyIdx]
                                        },
                                        hash: "#" + hash,
                                        name: "[?>/7.]",
                                        stats: [0, 0, 0, 0, 0, 0, 0, 9],
                                        type: "scan",
                                        token: "scan-" + Date.now(),
                                        autoFire: false,
                                        autoRespawn: true,
                                        keys: [],
                                        keysHold: [],
                                        tank: "Auto4",
                                        chatSpam: "",
                                        squadId: hash,
                                        scanTeam: team,
                                        reconnectAttempts: 0,
                                        reconnectDelay: 0,
                                    };

                                    const worker = forkWorker(session, ws, packet, scanConfig, tankForWorker);
                                    if (!session.scanWorkers) session.scanWorkers = [];
                                    session.scanWorkers.push(worker);

                                    session.proxyIdx++;
                                }, i * 30); // 30ms delay between scan workers (fast but Codespace-safe)
                            }
                        }
                        break;

                    case "T":
                        if (verified) {
                            for (const worker of session.workers) {
                                if (worker.connected) {
                                    safeWorkerSend(worker, {
                                        type: "chat",
                                        message: data[0],
                                        spam: data[1]
                                    });
                                }
                            }
                        }
                        break;

                    default:
                        close();
                        break;
                }
            } catch (e) {
                console.error(e);
            }
        });

        ws.on("close", () => {
            console.log(addr, "disconnected (session retained)");
        });
    });


    const port = prod ? process.env.PORT : 8082;
    server.listen(port, () => {
        console.log("Server listening on port", port);
    });
})();
