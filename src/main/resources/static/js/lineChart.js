
function lineChartDefaultSettings(){
    return {
        minValue: 0, // The gauge minimum value.
        maxValue: 100, // The gauge maximum value.
        historySize: 50, // Number of data points to keep in history
        interval: "s5",
        transitionTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        displayUnit: "", // If true, a % symbol is displayed after the value.
        mediumThreshold: 0.5, // The color of the value text when the wave does not overlap it.
        highThreshold: 0.9 // The color of the value text when the wave overlaps it.
    };
}

function loadLineChart(elementId, values, config) {
    if(config == null) config = lineChartDefaultSettings();

    var chart = d3.select("#" + elementId);
    var margin = {top: 20, right: 20, bottom: 30, left: 40};
    var width = parseInt(chart.style("width"));
    var height = parseInt(chart.style("height"));
    chart = chart.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //chart.append("clipPath").attr("id", "chartBody_" + elementId).append("rect").attr("x", 0).attr("y", 0).attr("width", width - margin.left - margin.right).attr("height", height - margin.top - margin.bottom);
    var x = d3.time.scale().range([0, width - margin.left - margin.right]);
    var dateFormat = d3.time.format.multi([
        ["%-I:%M:%S", function(d) { return d.getMilliseconds(); }],
        ["%-I:%M:%S", function(d) { return d.getSeconds(); }],
        ["%-I:%M", function(d) { return d.getMinutes(); }],
        ["%-I%p", function(d) { return d.getHours(); }],
        ["%b %d", function(d) { return d.getDay() && d.getDate() != 1; }],
        ["%b %d", function(d) { return d.getDate() != 1; }],
        ["%Y-%m", function(d) { return d.getMonth(); }],
        ["%Y", function(d) { return true; }]
    ]);
    var ticksUnit = d3.time.minutes;
    var ticksInterval = 1;
    if (config.interval == "s10") {
        ticksUnit = d3.time.minutes;
        ticksInterval = 2;
    }
    if (config.interval == "s30") {
        ticksUnit = d3.time.minutes;
        ticksInterval = 10;
    }
    if (config.interval == "m1") {
        ticksUnit = d3.time.minutes;
        ticksInterval = 30;
    }
    if (config.interval == "m5") {
        ticksUnit = d3.time.hours;
        ticksInterval = 1;
    }
    if (config.interval == "m15") {
        ticksUnit = d3.time.hours;
        ticksInterval = 2;
    }
    if (config.interval == "m30") {
        ticksUnit = d3.time.hours;
        ticksInterval = 6;
    }
    if (config.interval == "h1") {
        ticksUnit = d3.time.days;
        ticksInterval = 1;
    }
    if (config.interval == "h2") {
        ticksUnit = d3.time.days;
        ticksInterval = 2;
    }
    if (config.interval == "d1") {
        ticksUnit = d3.time.days;
        ticksInterval = 15;
    }
    var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(dateFormat).ticks(ticksUnit, ticksInterval);
    chart.append("g").attr("class", "lineChart x axis").attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")").call(xAxis);
    var y = d3.scale.linear().range([height - margin.top - margin.bottom, 0]);
    var yAxis = d3.svg.axis().scale(y).orient("left");
    chart.append("g").attr("class", "lineChart y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(config.displayUnit);
    var line = d3.svg.line().x(function(d) { return x(d.x); }).y(function(d) { return y(d.y); });
    var lines = chart.selectAll(".lineChart.line").data(values).enter().append("g").attr("class", "lineChart line");

    function ChartUpdater(){
        this.update = function(d, v){
            var x = d;
            var existing_chart_values = {};
            $.each(Object.keys(v), function( index, value ) {
                existing_chart_values[value] = false;
            });

            /* Update Line Chart Values */
            var chart_dates = config.dates;
            if (chart_dates.length >= config.historySize) {
                chart_dates.shift();
            }
            chart_dates.push(x);

            var chart_values = config.values;
            $.each(chart_values, function( index, chart_value ) {
                var key = chart_value.key;
                if (v[key] != null) {
                    existing_chart_values[key] = true;
                    if (v[key].color != null) {
                        chart_value.color = v[key].color;
                    }
                    if (chart_value.values.length >= config.historySize) {
                        chart_value.values.shift();
                    }
                    chart_value.values.push({x: x, y: v[key].value});
                } else {
                    // Incoming data does not have existing key
                    chart_value.values.push({x: x, y: 0});
                }
            });

            $.each(Object.keys(existing_chart_values), function( index, value ) {
                if (!existing_chart_values[value]) {
                    var chart_value = {
                        key: value,
                        values: [{x: x, y: v[value].value}],
                        color: v[value].color
                    };
                    chart_values.push(chart_value);
                }
            });

            var all_values = [].concat.apply([], chart_values.map(function(chart_value) {
                return chart_value.values.map(function(value) {
                    return value.y;
                });
            }));

            var min = Math.min.apply(null, all_values);
            var max = Math.max.apply(null, all_values);
            config.minValue = min;
            config.maxValue = max;

            var dates = chart_dates;
            var values = chart_values;

            var x = d3.time.scale().range([0, width - margin.left - margin.right]).domain(d3.extent(dates, function(d) { return d; }));
            var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(dateFormat).ticks(ticksUnit, ticksInterval);
            chart.select(".lineChart.x.axis").transition().duration(config.transitionTime).call(xAxis);

            var y = d3.scale.linear().range([height - margin.top - margin.bottom, 0]).domain([config.minValue, config.maxValue]);
            var yAxis = d3.svg.axis().scale(y).orient("left");
            chart.select(".lineChart.y.axis").transition().duration(config.transitionTime).call(yAxis).select("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(config.displayUnit);

            var line = d3.svg.line().x(function(d) { return x(d.x); }).y(function(d) { return y(d.y); });
            var lines = chart.selectAll(".lineChart.line").data(values).enter().append("g").attr("class", "lineChart line");

            lines.append("path");
            chart.selectAll(".lineChart.line path").data(values).attr("d", function(d) { return line(d.values); }).attr("stroke", function(d) { return d.color }); //.attr("clip-path", "url(#chartBody_" + elementId + ")");

            lines.append("text").text("");
            chart.selectAll(".lineChart.line text").data(values).transition().duration(config.transitionTime).text(function(d) { return d.key }).attr("fill", function(d) { return d.color; }).attr("text-anchor", "end").attr("transform", function(d) { return "translate(" + x(d.values[d.values.length - 1].x) + "," + y(d.values[d.values.length - 1].y) + ")"; }).attr("text-anchor", "start");
        }
    }

    return new ChartUpdater();
}