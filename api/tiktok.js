const Axios = require("axios");
const { load } = require("cheerio");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

const TiktokURLregex =
  /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;

const _musicaldownurl = "https://musicaldown.com/en";
const _musicaldownapi = "https://musicaldown.com/download";

const isURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getRequest = async (url, proxy) => {
  if (!TiktokURLregex.test(url)) {
    throw new Error("Invalid Tiktok URL. Make sure your URL is correct!");
  }

  try {
    const response = await Axios.get(_musicaldownurl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
      },
      httpsAgent:
        proxy &&
        (proxy.startsWith("http") || proxy.startsWith("https")
          ? new HttpsProxyAgent(proxy)
          : proxy.startsWith("socks")
          ? new SocksProxyAgent(proxy)
          : undefined),
    });

    const $ = load(response.data);
    const cookie = response.headers["set-cookie"]?.[0]?.split(";")[0] || null;
    const input = $("div > input").map((_, el) => $(el));
    const formData = {
      [input.get(0).attr("name")]: url,
      [input.get(1).attr("name")]: input.get(1).attr("value"),
      [input.get(2).attr("name")]: input.get(2).attr("value"),
    };

    return { cookie, formData };
  } catch {
    throw new Error("Failed to get the request form!");
  }
};

const musicallydown = async (url, proxy) => {
  const { cookie, formData } = await getRequest(url, proxy);

  try {
    const response = await Axios.post(
      _musicaldownapi,
      new URLSearchParams(Object.entries(formData)),
      {
        headers: {
          cookie,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
        },
        httpsAgent:
          proxy &&
          (proxy.startsWith("http") || proxy.startsWith("https")
            ? new HttpsProxyAgent(proxy)
            : proxy.startsWith("socks")
            ? new SocksProxyAgent(proxy)
            : undefined),
      }
    );

    const $ = load(response.data);

    const videos = {};
    $("a[data-event]").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const type = $(el).data("event").includes("hd")
          ? "videoHD"
          : $(el).data("event").includes("mp4")
          ? "videoSD"
          : $(el).data("event").includes("watermark")
          ? "videoWatermark"
          : null;

        if (type) videos[type] = href;
      }
    });

    return {
      type: "video",
      author: {
        avatar: $("div.img-area > img").attr("src"),
        nickname: $("h2.video-author > b").text(),
      },
      desc: $("p.video-desc").text(),
      ...videos,
    };
  } catch (error) {
    throw new Error("Failed to fetch TikTok video.");
  }
};

module.exports = { musicallydown };
