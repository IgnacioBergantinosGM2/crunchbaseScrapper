import { firefox } from 'playwright';

export const importCrunchBaseList = async (
	cbUsername,
	cbPassword,
	apolloUsername,
	apolloPassword,
	cbList,
	importApollo
) => {
	try {
		console.log('Process Started');
		const browser = await firefox.launch({
			headless: true,
			args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
			env: {
				HOME: '/root',
			},
		});
		const context = await browser.newContext();
		const page = await context.newPage();
		let isButtonDisabled = false;
		let completeContent = [];
		const formattedDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '').slice(2);
		const fileName = `${formattedDate}-crunchbase-export.csv`;

		await page.goto('https://www.crunchbase.com/login');
		await page.waitForTimeout(3000);
		await page.fill('input[name="email"]', cbUsername);
		await page.fill('input[name="password"]', cbPassword);
		await page.waitForTimeout(1000);
		await page.click('button.login');
		await page.waitForTimeout(2000);
		await page.goto(cbList);

		await page.waitForTimeout(15000);

		const gridHeaders = await page
			.locator('grid-column-header')
			.evaluateAll((columns) =>
				columns
					.map((column) => column.textContent.trim())
					.filter((column) => column !== '' && column.toLowerCase() !== 'add column')
			);

		do {
			const gridContent = await page.locator('grid-row').evaluateAll((rows) =>
				rows.map((row) => {
					const columns = row.querySelectorAll('grid-cell');
					return Array.from(columns)
						.map((column) => {
							const text = column.textContent.trim();

							const linkElement = column.querySelector('a');
							if (linkElement && text === 'View on LinkedIn') {
								const hyperlink = linkElement.href;
								return hyperlink;
							} else {
								return text;
							}
						})
						.filter((column) => column !== '');
				})
			);

			completeContent.push(...gridContent);

			const nextButton = page.locator('a[aria-label="Next"]');

			isButtonDisabled = await nextButton.evaluate((node) => {
				return node.getAttribute('aria-disabled') === 'true';
			});

			if (!isButtonDisabled) {
				await nextButton.click();
				await page.waitForTimeout(6000);
			}

			console.log('Page Completed!');
		} while (!isButtonDisabled);

		const escapeCsvField = (field) => {
			if (field.includes(',') || field.includes('"') || field.includes('\n')) {
				return `"${field.replace(/"/g, '""')}"`;
			}
			return field;
		};

		let csvContent = gridHeaders.map(escapeCsvField).join(',') + '\n';
		completeContent.forEach((row) => {
			const filteredRow = row.slice(0, gridHeaders.length);
			csvContent += filteredRow.map(escapeCsvField).join(',') + '\n';
		});

		const csvBuffer = Buffer.from(csvContent, 'utf-8');
		const csv64String = csvBuffer.toString('base64');

		console.log('Table Extraction Successfully!');
		if (!importApollo) {
			browser.close();
			return {
				status: 'Table Extraction Successfully!',
				csv_file: csvBuffer,
			};
		}

		await page.goto('https://app.apollo.io/#/login');
		await page.waitForTimeout(2000);
		await page.fill('input[name="email"]', apolloUsername);
		await page.waitForTimeout(1000);
		await page.fill('input[name="password"]', apolloPassword);
		await page.waitForTimeout(1000);
		await page.click('button[data-cy="login-button"]');
		await page.waitForTimeout(3000);
		await page.goto('https://app.apollo.io/#/accounts/import');
		await page.waitForTimeout(3000);

		const dragAndDropScript = `
        const fileName = '${fileName}'; 
        const fileType = 'text/csv';   
        const base64 = '${csv64String}'; 

        function base64ToBlob(base64, contentType) {
            const byteCharacters = atob(base64);
            const byteArrays = [];
            const chunkSize = 1024;

            for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
                const slice = byteCharacters.slice(offset, offset + chunkSize);
                const byteNumbers = new Array(slice.length);

                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        }

        const dataTransfer = new DataTransfer();
        const blob = base64ToBlob(base64, fileType);
        const file = new File([blob], fileName, { type: fileType });
        dataTransfer.items.add(file);

        const dropEvent = new DragEvent('drop', {
            dataTransfer: dataTransfer,
            bubbles: true,
            cancelable: true
        });

        const dragEnterEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true });
        const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });

        const dropZone = document.querySelector('div.zp_ttyNP');
        dropZone.dispatchEvent(dragEnterEvent);
        dropZone.dispatchEvent(dragOverEvent);
        dropZone.dispatchEvent(dropEvent);
    `;

		await page.evaluate(dragAndDropScript);
		await page.waitForTimeout(2000);
		await page.click('div[title="Update the existing record with information from CSV"]');
		await page.getByText('Skip it (do not update existing record)').click();
		await page.click('button[data-cy="import-button"]');
		await page.waitForTimeout(500);
		await page.getByText('Yes').click();

		browser.close();
		console.log('Import Completed Successfully!');

		return {
			status: 'Import Completed Successfully!',
			csv_file: csvBuffer,
		};
	} catch (ex) {
		console.log(`Import Failed: ${ex}`);
		return {
			status:
				'There was an error, check if the credentials are correct. If the error persist try again later',
			csv_file: null,
		};
	}
};
