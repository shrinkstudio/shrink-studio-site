(function () {
    var base = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf("/"));
    var components = [
        "components/hover-list.js"
    ];
    components.forEach(function (path) {
        var s = document.createElement("script");
        s.src = base + "/" + path;
        document.head.appendChild(s);
    });
})();
