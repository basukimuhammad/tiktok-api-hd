const Fastify = require("fastify");
const { musicallydown } = require("./tiktok.js");

const app = Fastify({ logger: true });

app.get("/", async (req, res) => {
  res.send(
    "Selamat datang di API TikTok Downloader! Gunakan /tiktok?query={link_tiktok}"
  );
});

app.get("/tiktok", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).send({
      status: "error",
      message: "Parameter query tidak ditemukan! Gunakan ?query={link_tiktok}",
    });
  }

  try {
    const result = await musicallydown(query);
    res.send({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: "Gagal mendapatkan video TikTok. Coba lagi nanti.",
      error: error.message,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server berjalan di: http://localhost:${port}`);
});
