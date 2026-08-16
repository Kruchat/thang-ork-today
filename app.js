import { formatThaiDate } from "./schema.js";
import { getPublishedToday, getIssue } from "./store.js";

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function renderIssue(issue) {
  const main = document.getElementById("main");
  main.innerHTML = "";

  if (!issue) {
    main.append(
      el("div", { class: "empty" }, [
        "ยังไม่มีฉบับเผยแพร่ — ไปที่หลังบ้านเพื่อสร้างฉบับวันนี้",
      ])
    );
    return;
  }

  const card = el("article", { class: "issue-card" });

  const top = el("div", { class: "issue-top" }, [
    el("div", { class: "issue-date" }, formatThaiDate(issue.date)),
    el("h1", { class: "issue-title" }, issue.problem.title || "ไม่มีหัวข้อ"),
    el("p", { class: "issue-summary" }, issue.problem.summary || ""),
  ]);

  if (issue.problem.tags?.length) {
    top.append(
      el(
        "div",
        { class: "tags" },
        issue.problem.tags.map((t) => el("span", { class: "tag" }, t))
      )
    );
  }
  card.append(top);

  const actions = (issue.freeActions || []).filter(Boolean);
  if (actions.length) {
    card.append(
      el("section", { class: "section" }, [
        el("p", { class: "section-label" }, "ทำได้ทันที โดยไม่ต้องซื้อ"),
        el(
          "ol",
          { class: "actions" },
          actions.map((text, i) =>
            el("li", {}, [
              el("span", { class: "step-num" }, String(i + 1)),
              el("p", {}, text),
            ])
          )
        ),
      ])
    );
  }

  if (issue.product && issue.product.name) {
    const p = issue.product;
    const hasLink = Boolean(p.shopeeUrl && p.shopeeUrl.trim());
    card.append(
      el("section", { class: "section product" }, [
        el("p", { class: "section-label" }, "ถ้าจะใช้ของช่วย — ชิ้นเดียว"),
        el("h2", { class: "product-name" }, p.name),
        el("p", { class: "product-why" }, p.why || ""),
        el("div", { class: "product-meta" }, [
          p.priceHint ? el("span", {}, p.priceHint) : null,
        ]),
        hasLink
          ? el("div", { class: "btn-row" }, [
              el(
                "a",
                {
                  class: "btn btn-primary",
                  href: p.shopeeUrl,
                  target: "_blank",
                  rel: "noopener noreferrer sponsored",
                },
                "ดูบน Shopee"
              ),
            ])
          : el("p", { class: "product-why" }, "ยังไม่ได้วางลิงก์นายหน้า"),
      ])
    );
  } else {
    card.append(
      el("section", { class: "section no-product" }, [
        el("p", { class: "section-label" }, "วันนี้ไม่จำเป็นต้องซื้อของ"),
        el("p", {}, "ใช้ทางออกด้านบนให้ครบก่อน ก็พอสำหรับวันนี้"),
      ])
    );
  }

  if (issue.sources && (issue.sources.aqi || issue.sources.weather)) {
    const bits = [];
    if (issue.sources.aqi != null) bits.push(`AQI ${issue.sources.aqi}`);
    if (issue.sources.weather) bits.push(issue.sources.weather);
    card.append(
      el("div", { class: "sources" }, `อ้างอิงสภาพวันนี้: ${bits.join(" · ")}`)
    );
  }

  main.append(card);
}

function boot() {
  const params = new URLSearchParams(location.search);
  const id = params.get("d");
  const issue = id ? getIssue(id) : getPublishedToday();
  const loading = document.getElementById("loading");
  if (loading) loading.remove();
  renderIssue(issue && (id || issue.status === "published") ? issue : getPublishedToday());
}

boot();
