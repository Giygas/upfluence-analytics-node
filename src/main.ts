import Koa from "Koa";

const app = new Koa();

app.use(async (ctx) => {
  if (ctx.method != "GET") {
    ctx.status = 405;
    ctx.body = "Method not allowed";
    return;
  }
  if (ctx.path != "/analytics") {
    ctx.status = 404;
    ctx.body = "Invalid path";
    return;
  }

  ctx.body = "Hello World";
});

app.listen(3000);
