document.getElementById('import_apollo').addEventListener('click', () => {
	const checkbox = document.getElementById('import_apollo');
	const apolloUsername = document.getElementById('apollo_username');
	const apolloPassword = document.getElementById('apollo_password');
	const downloadCSVFile = document.getElementById('download_csv');

	if (checkbox.checked) {
		apolloUsername.disabled = false;
		apolloPassword.disabled = false;
	} else {
		apolloUsername.disabled = true;
		apolloPassword.disabled = true;
		downloadCSVFile.checked = true;
	}
});

document.getElementById('importForm').addEventListener('submit', async (event) => {
	event.preventDefault();
	const formData = {
		cb_username: document.getElementById('cb_username').value,
		cb_password: document.getElementById('cb_password').value,
		apollo_username: document.getElementById('apollo_username').value,
		apollo_password: document.getElementById('apollo_password').value,
		list_url: document.getElementById('cb_list').value,
		import_apollo: document.getElementById('import_apollo').checked,
	};

	const button = document.getElementById('importButton');
	button.innerText = 'Importing...';
	button.disabled = true;

	const downloadCSVFile = document.getElementById('download_csv').checked;

	let resData;
	await fetch('https://crunchbase-scrapper.fly.dev/run-import', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData),
	})
		.then((response) => response.json())
		.then((data) => (resData = data));

	if (downloadCSVFile && resData.csv_file != null) {
		downloadBuffer(resData.csv_file);
	}

	button.innerText = 'Import';
	button.disabled = false;
});

function downloadBuffer(rawBuffer) {
	const buffer = rawBuffer instanceof ArrayBuffer ? rawBuffer : Uint8Array.from(rawBuffer.data);
	const decoder = new TextDecoder('utf-8');
	const csvContent = decoder.decode(buffer);
	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'crunchbaseImport.csv';

	a.click();
	URL.revokeObjectURL(url);
}
