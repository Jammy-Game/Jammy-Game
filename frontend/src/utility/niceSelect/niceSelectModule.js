const niceSelect = (ref) => {
  const element = ref.current;
  let option = element.querySelectorAll("option");

  function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
  element.style.display = "none";
  var el = document.createElement("div");
  insertAfter(element, el);
  el.className = "nice-select wide";
  let ul = document.createElement("ul"),
    span = document.createElement("span");
  ul.classList.add("list");
  span.classList.add("current");
  el.appendChild(ul);
  el.appendChild(span);
  el.addEventListener("click", () => {
    el.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!el.contains(e.target)) {
      el.classList.remove("open");
    }
  });
  option.forEach((opt) => {
    var li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML = opt.innerText;
    li.className = "option";
    li.value = opt.value;
    let defultValue = opt.getAttribute("data-display");
    let selected = opt.getAttribute("selected");
    let disabled = opt.getAttribute("disabled");
    if (defultValue || selected !== null || disabled !== null) {
      li.className = "option focus";
      span.innerText = opt.innerText;
    } else {
      span.innerText = option[0].innerText;
    }
    li.addEventListener("click", () => {
      if (disabled == null) {
        span.innerHTML = opt.innerText;
        ref.current.value = opt.value;
      }
    });
  });
};
module.exports = niceSelect;
