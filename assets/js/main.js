document.addEventListener("DOMContentLoaded", main); // Will run the main function when everything is loaded


var DATA = window.__DATA__;
var pi = Math.PI;

function main() {
    // Grab the DOM rows so we can generate interactive elements
    var rows = {
        curvetypes: d3.select('#curvetypes'),
        datasets: d3.select('#datasets'),
        settings: d3.select('#settings')
    }

    // Initialize the curvetypes row, so we know which curves to render and how
    var curvetypes = initializeCurvetypes(rows.curvetypes)
    var curvetypeState = function() {
        var state = [];
        curvetypes.selectAll('.curvetype--toggle').each( function() { state.push({ name: this.id, active: this.checked }) } )
        return state;
    }
    // curvetypes.on('change.showState', () => console.log(curvetypeState()))

    // Initialize the settings row, so we can change various behaviours of the application
    var settings = initizalizeSettings(rows.settings)

    settings(function(s) { console.log(s) })

}



/*
 * --- Curvetype Row ---
 *
 * This function has a simple job - render the markup for each type of curve
 * and return a data structure describing the ui, so that we can listen for changes.
 * This function is also responsible for the two convenience 'select [stuff]' buttons.
 *
 * @todo Bake in rendering for each curve's parameters (need sliders first)
 * @param root = The DOM element under which ui controls and curve labels are rendered
 * @return root = A d3 element that contains the relevant UI
 */
function initializeCurvetypes(root) {
    var curvetype_list = root.append('div').classed('labels', true).selectAll('.curvetype').data(DATA.curvetypes)

    // Add checkboxes to control the toggled state of the labels
    curvetype_list.enter()
        .append('input')
            .attr('type', 'checkbox')
            .attr('id', function (d) { return d.name })
            .classed('curvetype--toggle', true)

    // Add nice looking labels for the user to click on
    curvetype_list.enter()
        .append('label')
            .classed('curvetype', true)
            .attr('for', function (d) { return d.name })
            .append('h4').text(function (d) { return 'd3.curve' + d.name })


    // Add a select all button
    root.datum(DATA.curvetypes)
        .append('button')
            .text('Select All')
            .on('click', function(d) {
                root.selectAll('.curvetype--toggle').property('checked', true)
                root.selectAll('.curvetype').classed('selected', true)
            })

    // Add a select none button
    root.datum(DATA.curvetypes)
        .append('button')
            .text('Select None')
            .on('click', function(d) {
                root.selectAll('.curvetype--toggle').property('checked', false)
                root.selectAll('.curvetype').classed('selected', false)
            })

    // Add an event listener to toggle label styles depending on checkbox values
    root.selectAll('.curvetype--toggle').on('change.updateLabel', function (d, i, n) {
        root.select('.curvetype[for=' + this.id + ']').classed('selected', this.checked)
    })

    return root;
}

/*
 * --- Settings Row ---
 *
 * This function will grab the predefined settings (from DATA) and render them for
 * configuration to root. If will also return a function that returns the current
 * state of the settings.
 *
 * @param root = As you would expect - this is where to render the settings controls
 * @return subscribe = A function that accepts a callback as a parameter. When the settings
 *                     are changed, this function calls the callback with the new settings
 */
function initizalizeSettings(root) {
    // UTILITY FUNCTIONS
    var getValue = function(node) { // To determine which property of a DOM node gives its relevant value
        return (node.type === 'checkbox' || node.type === 'radio') ? node.checked : node.value
    }

    var wordify = function(phrase) { // This is for defining valid IDs
        return phrase.split(' ').join('-').toLowerCase()
    }

    var inputType = function(datatype) { // So we know what to render for a given input type
        switch (datatype) {
            case "boolean":
                return "checkbox"
            case "number":
                return "number"
            default:
                return "text"
        }
    }

    // Bind to settings from DATA
    var settings = root.selectAll('.settings--control').data(DATA.settings)

    // Each setting is contained in a controls group
    var settings_controls = settings.enter()
        .append('div').classed('settings--control', true)

    // Add the appropriate input type for each setting
    settings_controls.append('input')
            .attr('type', function (d) { return inputType(d.type) })
            .attr('id', function (d) { return wordify(d.name) })

    // Add labels for each settings
    settings_controls.append('label')
            .text( function (d) { return d.name } )
            .attr('for', function (d) { return wordify(d.name) })

    // Returns a settings object, based on the current state of the UI
    var getSettings = function () {
        var settings = [];
        settings_controls.selectAll('input').each(function (d) { settings.push( { name: d.name, value: getValue(this) } ) })
        return settings;
    }

    // This looks complex, but in reality, it's quite simple.
    // 1. Make an array, which will hold functions
    // 2. The subscriber function, when called, will add a function to this array
    // 3. Whenever the settings change, call every function in the array with the new settings
    var subscribers= [];
    var subscribe = function(callback) {
        subscribers.push(callback);
    }
    settings_controls.on('change.notifySubscribers', function() {
        for (var i = 0; i < subscribers.length; i++) {
            subscribers[i].call(this, getSettings())
        }
    })

    return subscribe;
}

