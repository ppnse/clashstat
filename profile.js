const statMap = {};
const clashFlag = Symbol("clashstat");

const nativeXHO = XMLHttpRequest.prototype.open;
const nativeXHS = XMLHttpRequest.prototype.send;

const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en;q=0.9",
    "content-type": "application/json;charset=UTF-8"
};

XMLHttpRequest.prototype.open = function (_, endpoint) {
    if (endpoint == "/services/CodinGamer/findCodingamerFollowCard") {
        this[clashFlag] = true;
    }
    return nativeXHO.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function (partial) {
    if (this[clashFlag]) {
        const clashStat = fetch("https://www.codingame.com/services/Leaderboards/getCodinGamerClashRanking", {
            method: "POST", headers,
            body: JSON.stringify([JSON.parse(partial)[0], "global", null])
        }).then(x => x.json());
        const nativeLoad = this.onload;
        this.onload = function () {
            statMap[JSON.parse(this.responseText).publicHandle] = clashStat;
            nativeLoad.apply(this, arguments);
        };
    }
    return nativeXHS.apply(this, arguments);
};

new MutationObserver(async (mutations) => {
    const card = mutations[0].addedNodes?.[0];
    if (!card) return;

    const infoSection = card.querySelector("div > div.infoContainer-0-2-11 > div:nth-child(2)");
    const infoRank = infoSection.children[1];
    const infoSub = infoSection.children[2];
    
    infoRank.textContent = "loading...";
    infoSub.textContent = "??";
    
    const publicHandle = card.querySelector("div > a").href.split("/").at(-1);
    const clashStat = await statMap[publicHandle];

    if (clashStat) {
        infoRank.textContent = clashStat.rank.toLocaleString("en-US");
        infoSub.textContent = "th"; // Fix sub
        infoSection.appendChild(document.createTextNode(`\u00A0(${clashStat.clashesCount.toLocaleString("en-US")})`));
    } else { // First clash?
        infoRank.textContent = "L";
        infoSub.textContent = "s";
    }

}).observe(document.querySelector("codingamer-card.codingamer-card-popup"), { childList: true });