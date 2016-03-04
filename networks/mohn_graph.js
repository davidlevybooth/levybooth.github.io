
/**
 * This is an example on how to use sigma filters plugin on a real-world graph.
 */
var filter;

/**
 * DOM utility functions
 */
var _ = {
  $: function (id) {
    return document.getElementById(id);
  },

  all: function (selectors) {
    return document.querySelectorAll(selectors);
  },

  removeClass: function(selectors, cssClass) {
    var nodes = document.querySelectorAll(selectors);
    var l = nodes.length;
    for ( i = 0 ; i < l; i++ ) {
      var el = nodes[i];
      // Bootstrap compatibility
      el.className = el.className.replace(cssClass, '');
    }
  },

  addClass: function (selectors, cssClass) {
    var nodes = document.querySelectorAll(selectors);
    var l = nodes.length;
    for ( i = 0 ; i < l; i++ ) {
      var el = nodes[i];
      // Bootstrap compatibility
      if (-1 == el.className.indexOf(cssClass)) {
        el.className += ' ' + cssClass;
      }
    }
  },

  show: function (selectors) {
    this.removeClass(selectors, 'hidden');
  },

  hide: function (selectors) {
    this.addClass(selectors, 'hidden');
  },

  toggle: function (selectors, cssClass) {
    var cssClass = cssClass || "hidden";
    var nodes = document.querySelectorAll(selectors);
    var l = nodes.length;
    for ( i = 0 ; i < l; i++ ) {
      var el = nodes[i];
      //el.style.display = (el.style.display != 'none' ? 'none' : '' );
      // Bootstrap compatibility
      if (-1 !== el.className.indexOf(cssClass)) {
        el.className = el.className.replace(cssClass, '');
      } else {
        el.className += ' ' + cssClass;
      }
    }
  }
};


function updatePane (graph, filter) {
  // get max degree and year
  var maxDegree = 0,
      maxYear = 0;  // Max Year Placeholder
      categories = {};

  // read nodes
  graph.nodes().forEach(function(n) {
    maxDegree = Math.max(maxDegree, graph.degree(n.id));
    //console.log("read maxDegree " + maxDegree); //
    maxYear = Math.max(maxYear, parseInt(n.attributes.year_start));  // should be 2016, returning 2012 *fixed
    //console.log("read maxYear " + maxYear); // 
    categories[n.attributes.area] = true; // changed to 'area' attribute
  })

  // min degree
  _.$('min-degree').max = maxDegree; // don't understand why .max for min degree
  //console.log("assigned degree " + _.$('min-degree').max); //
  _.$('max-degree-value').textContent = maxDegree;

    // year attributes set the ame as min degrees above for now
  _.$('year').max = maxYear; // why is this maxYear?
  //console.log('assigned year ' + _.$('year').max ); //
  _.$('max-year-value').textContent = maxYear;


  // node category
  var nodecategoryElt = _.$('node-category');
  Object.keys(categories).forEach(function(c) {
    var optionElt = document.createElement("option");
    optionElt.text = c;
    nodecategoryElt.add(optionElt);
  });

  // reset button
  _.$('reset-btn').addEventListener("click", function(e) {
    _.$('min-degree').value = 0;
    _.$('min-degree-val').textContent = '0';
    //console.log('reset year ' + _.$('min-degree').value + " " + typeof _.$('min-degree').value);
    //console.log('reset year value ' + _.$('min-degree-val').textContent + " " + typeof _.$('min-degree-val').textContent );


    _.$('year').value = parseInt(maxYear);  // placeholder value for the year reset
    _.$('year-val').textContent = maxYear;
    //console.log('reset year ' + _.$('year').value + " " + typeof _.$('year-val').textContent);
    //console.log('reset year value ' + _.$('year-val').textContent + " " + typeof _.$('year-val').textContent);

    _.$('node-category').selectedIndex = 0;
    filter.undo().apply();
    _.$('dump').textContent = '';
    _.hide('#dump');
  });

  // export button
  _.$('export-btn').addEventListener("click", function(e) {
    var chain = filter.serialize();
    console.log(chain);
    _.$('dump').textContent = JSON.stringify(chain);
    _.show('#dump');
  });
}

// Initialize sigma with the dataset:
// Data from the W. Mohn publication list 
// (nodes == top 100 collaborators, edges == papers)
// Graph attributes from Sci2 program, edited with python
// Graphed using Gephi 

sigma.parsers.gexf('mohn_dynamic.gexf', {
  container: 'graph-container',
  settings: {
    edgeColor: 'default',
    defaultEdgeColor: '#ccc',
    defaultEdgeType: 'curve',
  }
}, function(s) {
  // Initialize the Filter API
  filter = sigma.plugins.filter(s);

  updatePane(s.graph, filter);

  ////////////////////  Min Degree Filter

  function applyMinDegreeFilter(e) {
    var v = e.target.value; // filtered degree as string
    //console.log('filter degree ' + v);
    _.$('min-degree-val').textContent = v;

    filter
      .undo('min-degree')
      .nodesBy(
        function(n, options) {
          //console.log(this.graph.degree(n.id) + " " + typeof this.graph.degree(n.id));
          return this.graph.degree(n.id) >= options.minDegreeVal;
        },
        {
          minDegreeVal: +v // + operater converts min degree string to number type
        },
        'min-degree'
      )
      .apply();
  }

    ////////////////////  Year Filter

  function applyYearFilter(e) {
    var y = e.target.value; // filtered year as string
    console.log('filter year ' + y);
    _.$('year-val').textContent = y;

    filter
      .undo('year')
      .nodesBy(
        function(n, options) {
          yearInt = parseInt(n.attributes.year_start);
          //console.log(yearInt + " " + typeof yearInt);
          return yearInt <= options.yearVal;
        },
        {
          yearVal: +y // + operater converts year string to number type
        },
        'year'
      )
      .apply();
  }


  ////////////////////  Catagory Filter

  function applyCategoryFilter(e) {
    var c = e.target[e.target.selectedIndex].value;
    filter
      .undo('node-category')
      .nodesBy(
        function(n, options) {
          return !c.length || n.attributes[options.property] === c || n.id === 'n1';
        },
        {
          property: 'area' // Changed to populate catagory option with 'area' attribute
        },
        'node-category'
      )
      .apply();
  }

  _.$('min-degree').addEventListener("input", applyMinDegreeFilter);  // for Chrome and FF
  _.$('min-degree').addEventListener("change", applyMinDegreeFilter); // for IE10+, that sucks
  _.$('node-category').addEventListener("change", applyCategoryFilter);

// Apply year filters
  _.$('year').addEventListener("input", applyYearFilter);  // for Chrome and FF
  _.$('year').addEventListener("change", applyYearFilter); // for IE10+, that sucks

});
