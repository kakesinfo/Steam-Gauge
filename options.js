// Fonction pour sauvegarder la clé
document.getElementById('saveBtn').addEventListener('click', () => {
	const key = document.getElementById('apiKey').value;
	
	// On utilise l'API de stockage de Chrome
	chrome.storage.local.set({ itadApiKey: key }, () => {
		const status = document.getElementById('status');
		status.textContent = 'Clé sauvegardée !';
		setTimeout(() => { status.textContent = ''; }, 2000);
	});
});

// Fonction pour restaurer la clé à l'ouverture de la page
document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.local.get(['itadApiKey'], (result) => {
		if (result.itadApiKey) {
			document.getElementById('apiKey').value = result.itadApiKey;
		}
	});
});