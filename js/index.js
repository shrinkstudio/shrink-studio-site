(function () {
    var base = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf("/"));
    var root = base.substring(0, base.lastIndexOf("/"));
    var styles = [
        "css/hover-list.css"
    ];
    var components = [
        "components/hover-list.js",
        "components/project-list.js",
        "components/current-time.js"
    ];
    styles.forEach(function (path) {
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = root + "/" + path;
        document.head.appendChild(l);
    });
    components.forEach(function (path) {
        var s = document.createElement("script");
        s.src = base + "/" + path;
        document.head.appendChild(s);
    });
})();
