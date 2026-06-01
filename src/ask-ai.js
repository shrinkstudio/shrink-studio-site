// -----------------------------------------
// ASK AI — Footer widget: open an AI assistant with a prefilled prompt about Shrink
// (Buttons are real Webflow elements with [data-ask-ai="<platform>"]. The JS only
//  attaches behaviour; markup + styling stay in Webflow. Prompt is CMS-bound via
//  [data-ask-ai-prompt] on each button.)
// -----------------------------------------

// Fallback used if a button has no [data-ask-ai-prompt] attribute set.
const FALLBACK_PROMPT = "I'm evaluating Shrink Studio (https://shrink.studio) as a potential web design agency partner. Please visit their site and summarise: what they specialise in, what types of companies they work with, how they're different from a traditional web agency, and any strengths or weaknesses I should consider. Keep it concise and neutral.";

const TOOLS = {
  chatgpt:    { mode: "link", url: "https://chatgpt.com/?q=" },
  perplexity: { mode: "link", url: "https://www.perplexity.ai/search/new?q=" },
  copilot:    { mode: "copy", url: "https://copilot.microsoft.com/" },
  claude:     { mode: "link", url: "https://claude.ai/new?q=" },
  gemini:     { mode: "link", url: "https://www.google.com/search?udm=50&aep=11&q=" },
};

let listeners = [];

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (_) {
    // Fall through to execCommand path
  }

  const t = document.createElement("textarea");
  t.value = text;
  t.style.position = "fixed";
  t.style.opacity = "0";
  t.style.pointerEvents = "none";
  document.body.appendChild(t);
  t.select();
  try { document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(t);
}

function getPrompt(el) {
  // Look on the button itself first, then walk up in case the attribute
  // lives on a wrapper (some CMS bindings expose attributes higher in the tree).
  let node = el;
  while (node && node !== document.body) {
    if (node.getAttribute) {
      const v = node.getAttribute("data-ask-ai-prompt");
      if (v && v.trim()) return v.trim();
    }
    node = node.parentNode;
  }
  return FALLBACK_PROMPT;
}

function handleClick(e) {
  const key = e.currentTarget.getAttribute("data-ask-ai");
  const tool = TOOLS[key];
  if (!tool) return;
  e.preventDefault();

  const prompt = getPrompt(e.currentTarget);

  if (tool.mode === "link") {
    window.open(tool.url + encodeURIComponent(prompt), "_blank", "noopener");
    return;
  }

  // Copy mode — Claude / Gemini.
  // Open the tab synchronously first so Safari doesn't block it as a popup,
  // then write the prompt to clipboard so the user can paste it.
  window.open(tool.url, "_blank", "noopener");
  copyText(prompt);
}

export function initAskAI(scope) {
  scope = scope || document;
  const triggers = scope.querySelectorAll("[data-ask-ai]");
  if (!triggers.length) return;

  triggers.forEach(function (btn) {
    btn.addEventListener("click", handleClick);
    listeners.push({ element: btn, type: "click", handler: handleClick });
  });
}

export function destroyAskAI() {
  listeners.forEach(function (item) {
    item.element.removeEventListener(item.type, item.handler);
  });
  listeners = [];
}
