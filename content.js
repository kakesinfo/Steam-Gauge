const match = window.location.href.match(/\/app\/(\d+)/);
if (match) {
  const appId = match[1];
  initHLTB(appId);
}

async function initHLTB(appId) {
  try {
    const data = await fetchHLTB(appId);
    
    if (!data) return;

    const mainStory = data.mainStory ? `${data.mainStory}h` : "--";
    const mainExtras = data.mainStoryWithExtras ? `${data.mainStoryWithExtras}h` : "--";
    const completionist = data.completionist ? `${data.completionist}h` : "--";

    const sidebarBlock = document.createElement('div');
    sidebarBlock.className = 'hltb-sidebar-block';
    
    // Structure verticale adaptée à la colonne de droite
    sidebarBlock.innerHTML = `
      <div class="hltb-header">
        Steam Gauge
      </div>
      <div class="hltb-row">
        <span class="hltb-label">Histoire principale</span>
        <span class="hltb-value">${mainStory}</span>
      </div>
      <div class="hltb-row">
        <span class="hltb-label">Histoire + Extras</span>
        <span class="hltb-value">${mainExtras}</span>
      </div>
      <div class="hltb-row">
        <span class="hltb-label">Complétionniste (100%)</span>
        <span class="hltb-value">${completionist}</span>
      </div>
    `;

    // On cible la colonne de droite de Steam
    const rightCol = document.querySelector('.rightcol.game_meta_data') || document.querySelector('.rightcol');
    
    if (rightCol) {
      // On l'insère tout en haut de la colonne, juste sous l'image du jeu
      rightCol.insertBefore(sidebarBlock, rightCol.firstChild);
    }
  } catch (error) {
    console.error("Erreur Steam HLTB :", error);
  }
}

function fetchHLTB(appId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "fetchHLTB", appId: appId }, (response) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      if (response && response.success) resolve(response.data);
      else reject(response?.error || "Erreur inconnue");
    });
  });
}