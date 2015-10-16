var viz = function(build) {

  build.viz = d3plus.viz()
    .container(build.container)
    .error("Loading")
    .draw();

  if (build.config.type === "geo_map") {
    load("/static/topojson/counties.json", function(data){
      build.viz.coords(data);
      viz.loadAttrs(build);
    })
  }
  else {
    viz.loadAttrs(build);
  }

  return build;

};

viz.loadAttrs = function(build) {
  var next = "loadData";

  if (build.attrs.length) {
    var loaded = 0, attrs = {};
    for (var i = 0; i < build.attrs.length; i++) {
      load(build.attrs[i].url, function(data, url, source){
        var a = build.attrs.filter(function(a){ return a.url === url; })[0];
        a.data = data;
        for (var i = 0; i < data.length; i++) {
          attrs[data[i].id] = data[i];
        }
        loaded++;
        if (loaded === build.attrs.length) {
          build.viz.attrs(attrs);
          viz[next](build);
        }
      })
    }
  }
  else {
    viz[next](build);
  }

};

viz.loadData = function(build) {
  var next = "finish";

  build.sources = [];

  if (build.data.length) {
    var loaded = 0, dataArray = [];
    for (var i = 0; i < build.data.length; i++) {
      load(build.data[i].url, function(data, url, source){
        var d = build.data.filter(function(d){ return d.url === url; })[0];
        if (d.static) {
          for (var i = 0; i < data.length; i++) {
            for (var k in d.static) {
              data[i][k] = d.static[k];
            }
          }
        }
        if (d.map) {
          for (var i = 0; i < data.length; i++) {
            for (var k in d.map) {
              data[i][k] = data[i][d.map[k]];
              delete data[i][d.map[k]];
            }
          }
        }
        if (d.split) {

          var split_data = [],
              regex = new RegExp(d.split.regex),
              keys = d3.keys(data[0]).filter(function(k){
                return regex.exec(k);
              });

          if (d.split.map) {
            for (var k in d.split.map) {
              d.split.map[k] = new RegExp(d.split.map[k]);
            }
          }

          for (var i = 0; i < data.length; i++) {
            var dat = data[i];
            for (var ii = 0; ii < keys.length; ii++) {
              var k = keys[ii];
              var dd = d3plus.util.copy(dat);
              dd[d.split.id] = k;
              dd[d.split.value] = dat[k];

              if (d.split.map) {
                for (var sk in d.split.map) {
                  var mapex = d.split.map[sk].exec(k);
                  if (mapex) {
                    dd[sk] = mapex[1];
                  }
                }
              }

              for (var iii = 0; iii < keys.length; iii++) {
                delete dd[keys[iii]];
              }
              split_data.push(dd);
            }
          }
          data = split_data;
        }
        d.data = data;
        d.source = source;
        build.sources.push(source)
        dataArray = dataArray.concat(data);
        loaded++;
        if (loaded === build.data.length) {
          build.viz.data(dataArray);
          viz[next](build);
        }
      })
    }
  }
  else {
    viz[next](build);
  }

}

viz.finish = function(build) {

  var source_text = d3plus.util.uniques(build.sources).reduce(function(str, s, i){
    str += s.dataset;
    return str;
  }, "");

  if (location.href.indexOf("/profile/") > 0) {
    d3.select(build.container.node().parentNode).select(".source")
      .text(source_text);
  }
  else {
    build.viz.footer(source_text);
  }

  if (!build.config.color) {
    build.config.color = function() {
      return build.color;
    };
    build.config.legend = false;
  }

  build.viz
    .config(build.config)
    .depth(build.config.depth)
    .config(viz.defaults(build))
    .config(viz[build.config.type](build))
    .error(false)
    .draw();

};
