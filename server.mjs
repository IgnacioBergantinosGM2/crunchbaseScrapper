import express from 'express';
import { importCrunchBaseList } from './scripts/importCrunchBaseList.mjs';
const app = express();
const PORT = 3000;
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Define an endpoint to run the Node.js logic
app.post('/run-import', async (req, res) => {
	const reqBody = req.body;
	const importResult = await importCrunchBaseList(
		reqBody.cb_username,
		reqBody.cb_password,
		reqBody.apollo_username,
		reqBody.apollo_password,
		reqBody.list_url,
		reqBody.import_apollo
	);
	res.send(importResult);
});

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
