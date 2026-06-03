(async () => {
    const { fork } = await import("child_process");
    const { WebSocketServer } = await import("ws");
    const { pack, unpack } = await import("msgpackr");
    const http = await import("http");


    const PROXIES = [
        "http://budget-v6.whiteproxies.com:27020"
    ];
    const prod = false;

    const isCodespace = !!process.env.CODESPACE_NAME || process.env.CODESPACE === "1" || process.env.CODESPACE === "true";
    const SPAWN_WINDOW = isCodespace ? 18000 : 8000;
    const SCAN_SPAWN_WINDOW = isCodespace ? 18000 : 8000;
    const SPAWN_DELAY_BASE = isCodespace ? 80 : 25;
    const SPAWN_DELAY_STEP_MAX = isCodespace ? 120 : 30;
    const SCAN_DELAY_BASE = isCodespace ? 120 : 45;
    const SCAN_DELAY_STEP_MAX = isCodespace ? 90 : 20;
    const SPAWN_CONCURRENCY = isCodespace ? 4 : 8;
    const SPAWN_JOIN_TIMEOUT = isCodespace ? 26000 : 12000;
    const SPAWN_JITTER = isCodespace ? 40 : 15;

    if (isCodespace) {
        console.log("Codespace detected: using safer bot spawn timing and queueing");
    }

    function getSpawnDelay(index, total) {
        const step = total > 1
            ? Math.min(SPAWN_DELAY_STEP_MAX, Math.max(6, Math.floor((SPAWN_WINDOW - SPAWN_DELAY_BASE) / (total - 1))))
            : SPAWN_DELAY_STEP_MAX;
        return Math.min(SPAWN_WINDOW, SPAWN_DELAY_BASE + index * step + Math.floor(Math.random() * SPAWN_JITTER));
    }

    function getScanSpawnDelay(index, total) {
        const step = total > 1
            ? Math.min(SCAN_DELAY_STEP_MAX, Math.max(8, Math.floor((SCAN_SPAWN_WINDOW - SCAN_DELAY_BASE) / (total - 1))))
            : SCAN_DELAY_STEP_MAX;
        return Math.min(SCAN_SPAWN_WINDOW, SCAN_DELAY_BASE + index * step + Math.floor(Math.random() * SPAWN_JITTER));
    }

    function ensureSpawnQueue(session) {
        if (!session.spawnQueue) session.spawnQueue = [];
        if (!session.spawnActive) session.spawnActive = 0;
    }

    async function startWorkerTask(session, task) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (session.proxyIdx >= PROXIES.length) {
                    session.proxyIdx = 0;
                }

                const worker = fork("index.js", []);
                worker.joined = false;
                worker.id = task.config.id;
                worker.startTime = Date.now();

                const cleanupJoin = () => {
                    if (worker._joinedDone) return;
                    worker._joinedDone = true;
                    clearTimeout(worker._joinTimeout);
                };

                worker.on('exit', () => {
                    session.workers = session.workers.filter(w => w !== worker);
                    cleanupJoin();
                });
                worker.on('error', (err) => {
                    console.error('Worker error:', err);
                });
                worker.on('disconnect', () => {
                    console.warn('Worker disconnected early');
                    cleanupJoin();
                });
                worker.on('message', (msg) => {
                    if (!ws || ws.readyState !== ws.OPEN) return;
                    if (msg && msg.type === 'report') {
                        packet('R', msg);
                    } else if (msg && msg.type === 'scanFound') {
                        packet('R', msg.report);
                    } else if (msg && msg.type === 'joined') {
                        worker.joined = true;
                        console.log(`Worker ${worker.id} joined after ${Date.now() - worker.startTime}ms`);
                        cleanupJoin();
                    }
                });

                session.workers.push(worker);

                if (worker.connected) {
                    if (session.tanks.length) {
                        let t = session.tanks[session.tankIdx];
                        safeWorkerSend(worker, { type: 'tankselect', tank: t });
                        session.tankIdx++;
                        if (session.tankIdx >= session.tanks.length) {
                            session.tankIdx = 0;
                        }
                    } else {
                        safeWorkerSend(worker, { type: 'tankselect', tank: session.tank });
                    }
                }

                safeWorkerSend(worker, { type: 'start', config: task.config });
                session.proxyIdx++;

                worker._joinTimeout = setTimeout(() => {
                    console.warn(`Worker ${worker.id} join timeout`);
                    cleanupJoin();
                }, SPAWN_JOIN_TIMEOUT);

                resolve(worker);
            }, task.delay);
        });
    }

    function processSpawnQueue(session) {
        ensureSpawnQueue(session);
        while (session.spawnActive < SPAWN_CONCURRENCY && session.spawnQueue.length) {
            const task = session.spawnQueue.shift();
            session.spawnActive++;
            startWorkerTask(session, task)
                .then(() => {
                    session.spawnActive = Math.max(0, session.spawnActive - 1);
                    if (session.spawnQueue.length) {
                        setTimeout(() => processSpawnQueue(session), 50);
                    }
                })
                .catch(() => {
                    session.spawnActive = Math.max(0, session.spawnActive - 1);
                    if (session.spawnQueue.length) {
                        setTimeout(() => processSpawnQueue(session), 50);
                    }
                });
        }
    }

    function queueWorkerSpawn(session, config, delay) {
        ensureSpawnQueue(session);
        session.spawnQueue.push({ config, delay });
        processSpawnQueue(session);
    }

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

    wss.on("connection", (ws, req) => {
        const addr = req.socket.remoteAddress;
        console.log(addr, "connected");

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
            ws.send(pack(args));
        }

        function safeWorkerSend(worker, message) {
            if (!worker || !worker.connected) return false;
            try {
                worker.send(message);
                return true;
            } catch (err) {
                console.error("Worker send failed:", err);
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
                                const spawnConfig = {
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
                                    reconnectAttempts: isCodespace ? 5 : 3,
                                    reconnectDelay: 15000,
                                };

                                queueWorkerSpawn(session, spawnConfig, getSpawnDelay(i, count));
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
                            for (const worker of session.workers) {
                                safeWorkerSend(worker, { type: "respawn" });
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
                                const spawnConfig = {
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

                                queueWorkerSpawn(session, spawnConfig, getScanSpawnDelay(i, count));
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