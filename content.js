const match = window.location.href.match(/\/app\/(\d+)/);
if (match) {
  const appId = match[1];
  const gameName = document.querySelector('.apphub_AppName')?.innerText.trim() || "";
  const subId = document.querySelector('input[name="subid"]');
  const editionId = subId ? subId.value : "";
  
  initSidebar(appId, gameName, editionId);
}

async function initSidebar(appId, gameName, editionId) {
  try {
    const data = await fetchData(appId, gameName, editionId);
    if (!data) return;

    const hltb = data.hltb || {};
    const ig = data.ig;
    const steam = data.steam || {};

    const mainStory = hltb.mainStory ? `${hltb.mainStory}h` : "--";
    const mainExtras = hltb.mainStoryWithExtras ? `${hltb.mainStoryWithExtras}h` : "--";
    const completionist = hltb.completionist ? `${hltb.completionist}h` : "--";
    
    let igPriceText = "N/A";
    let igUrl = "";
    if (ig && ig.price) {
      const cleanPrice = parseFloat(String(ig.price).replace(',', '.'));
      igPriceText = `${cleanPrice.toFixed(2)}€`;
      igUrl = ig.url;
    }

    let steamPriceText = "N/A";
    if (steam && steam.price && steam.price.amount) {
      const cleanSteamPrice = parseFloat(String(steam.price.amount).replace(',', '.'));
      steamPriceText = `${cleanSteamPrice.toFixed(2)}€`;
    }

    const sidebarBlock = document.createElement('div');

    sidebarBlock.className = 'ultimate-sidebar-block';
    sidebarBlock.innerHTML = `
      <div class="stats-header">Prix</div>

      <div class="stats-row steam-row">
        <span class="stats-label steam-label">Prix le plus bas Steam</span>
        <span class="stats-value steam-value">${steamPriceText}</span>
      </div>

      <div class="stats-row ig-row" id="ig-link">
        <span class="stats-label ig-label">Instant Gaming</span>
        <span class="stats-value ig-value">${igPriceText}</span>
      </div>

      <div class="stats-header stats-header__margin">Durée de vie</div>
      <div class="stats-row">
        <span class="stats-label">Histoire principale</span>
        <span class="stats-value">${mainStory}</span>
      </div>
      <div class="stats-row">
        <span class="stats-label">Histoire + Extras</span>
        <span class="stats-value">${mainExtras}</span>
      </div>
      <div class="stats-row">
        <span class="stats-label">Complétionniste (100%)</span>
        <span class="stats-value">${completionist}</span>
      </div>
    `;

    const rightCol = document.querySelector('.rightcol.game_meta_data') || document.querySelector('.rightcol');
    
    if (rightCol) {
      rightCol.insertBefore(sidebarBlock, rightCol.firstChild);
    
      const igRow = document.getElementById('ig-link');
      if (igUrl) {
        igRow.style.cursor = 'pointer';
        igRow.addEventListener('click', () => {
          window.open(igUrl, '_blank');
        });
      }
    }
  } catch (error) {
    console.error("Error Steam Gauge :", error);
  }
}

function fetchData(appId, gameName, editionId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ 
      action: "fetchData", 
      appId: appId, 
      gameName: gameName, 
      editionId: editionId 
    }, (response) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      if (response && response.success) resolve(response.data);
      else reject(response?.error || "Unknown error");
    });
  });
}
