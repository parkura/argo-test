import http from "node:http";

const name = process.env.SERVICE_NAME ?? "unknown";
const version = process.env.APP_VERSION ?? "dev";
const peers = (process.env.PEERS ?? "").split(",").filter(Boolean);

const server = http.createServer(async (req, res) => {
	if (req.url === "/healthz") {
		res.end("ok");
		return;
	}

	// gateway only: compose a fake "schema" from peer services.
	// During a rolling deploy, repeated calls here show MIXED peer versions —
	// the mixed-version window, live.
	if (req.url === "/composed" && peers.length > 0) {
		const parts = await Promise.all(
			peers.map(async (peer) => {
				try {
					const r = await fetch(`http://${peer}:3000/`);
					return await r.json();
				} catch (err) {
					return { service: peer, error: String(err) };
				}
			}),
		);
		res.setHeader("content-type", "application/json");
		res.end(JSON.stringify({ gateway: version, composed: parts }, null, 2));
		return;
	}

	res.setHeader("content-type", "application/json");
	res.end(JSON.stringify({ service: name, version, feature: "v12-feature" }));
});

server.listen(3000, () => console.log(`${name} ${version} listening on 3000`));
