/*
The purpose of this demo is to demonstrate how multiple charts on the same page
can be linked through DOM and Highcharts events and API methods. It takes a
standard Highcharts config with a small variation for each data set, and a
mouse/touch event handler to bind the charts together.
*/


/**
 * In order to synchronize tooltips and crosshairs, override the
 * built-in events with handlers defined on the parent element.
 */
['mousemove'].forEach(function (eventType) {
    document.getElementById('timeline').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                if (chart==null || chart.renderTo==null){
                    continue;
                }
                currentID = chart.renderTo.id;
                // Find coordinates within the chart
                if (chart.renderTo!==wordCloud){
                  event = chart.pointer.normalize(e);
                  point = chart.series[0].searchPoint(event, true);
                }
                // Get the hovered point
                if (point) {
                    if (chart.renderTo.id == "timeline"){
                      var data = worldmap[point.id];
                      geomap.setTitle({'text':point.id+' Worldwide Suicide Rate Distribution'});
                      geomap.series[0].update({'data':data});

                      lineChart.tooltip.update({enabled:true})
                      lineChart.series[0].setData(getRateLine(point.id));
                      wordCloud.setTitle({'text':'Suicide Rate For Each Age Group ( ' + point.id +' )',
                    'verticalAlign': 'top'})
                      wordCloud.series[0].update({'data': wordCloudData[point.id.toString()]});
                      point.highlight(e);
                    }
                    
                }

            }
        }
    );
});

var currentID; 

/**
 * Override the reset function, we don't need to hide the tooltips and
 * crosshairs.
 */
Highcharts.Pointer.prototype.reset = function () {
    return undefined;
};

/**
 * Highlight a point by showing tooltip, setting hover state and draw crosshair
 */
Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh(this); // Show the tooltip
};

/**
 * Synchronize zooming through the setExtremes event handler.
 */
function syncExtremes(e) {
    var thisChart = this.chart;

    if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(
                        e.min,
                        e.max,
                        undefined,
                        false,
                        { trigger: 'syncExtremes' }
                    );
                }
            }
        });
    }
}

function getRateLine(year){
  var currentData = []
  for(var i=2005;i<=2015;i++){
    if (i <=parseInt(year)){
      currentData.push(parseFloat(dataset[i]['suicide_rate']));
    }
    else{
      currentData.push(null);
    }
  }
  return currentData;
}



var timeline = {
    chart: {
      zoomType: 'x',
      type: 'timeline',
      backgroundColor:'transparent',
      color: 'white',
    },
    xAxis: {
      type: 'datetime',
      visible: false,
      labels: {
        format: '{value:%Y}'
      },
      style:{
        color: '#FFFFFF'
      }
    },
    yAxis: {
      gridLineWidth: 1,
      title: null,
      labels: {
        enabled: false
      },
      style:{
        color: '#FFFFFF'
      }
    },
    legend: {
      enabled: false
    },
    credits:{
        enabled: false,
    },
    title: {
      text: "Timeline For Overal Suicide Rate",
      style:{
        color: '#FFFFFF'
      }
    },
    subtitle: {
        text: 'World\'s Overall Suicide Rate From 2005 To 2015',
        style:{
          color: '#FFFFFF'
        }
    },
    tooltip: {
      enabled: false,
    },
    series: [{
      dataLabels: {
        allowOverlap: true,
        formatter: function(){
              var date = Highcharts.dateFormat('%Y',this.x);
              // var rate = this.point.label
              return '<span style="color:'+this.point.color+'">● </span><span style="font-weight: bold;" > ' +
                    date+'</span><br/>'+
                    '<span style="font-weight: normal; font-size: 6pt;" > '+'Suicide Rate: <b>'+(this.point.label*100).toFixed(3)+"‱" + "</b></span>";
        },
        
      },
      marker: {
        symbol: 'circle'
      },
      data: [],
    }]
  }

function changeConclusion(){
    var x = document.getElementById('currentTable');
    var y = document.getElementById('conclusion_text');
    console.log(y.style)

    if (x.style.visibility == 'hidden'){
      x.style.visibility = 'visible';
      y.style.visibility = 'hidden';
      x.style.display = "block";
      y.style.display = "none";
    }
    else{
      y.style.visibility = 'visible';
      y.style.display = "block";
      x.style.visibility = 'hidden';
      x.style.display = "none";
    }
    
}
var dataset = {};
var timeline_dict = {};
var worldmap = {};
var wordCloudData = {};
Highcharts.ajax({
    url:'./dataset1.json',
    dataType:'text',
    success: function(activity){
        activity = JSON.parse(activity);
        dataset = activity[0];
        timeline_data = [];
        timelineid = Object.keys(dataset);
        for (i =0;i<timelineid.length;i++){
            currentYear = dataset[timelineid[i]];
            year = currentYear['year'];
            date = new Date (year);
            if (timeline_dict.hasOwnProperty(date)==false){
                timeline_dict[date] = [];
            }
            year_dict = {};
            title = currentYear['suicide_rate'];
            if (timeline_dict[date].includes(title)==false){
                timeline_dict[date].push(title);
            }
            year_dict['x'] = date;
            year_dict['name'] = title;
            year_dict['label'] = title;
            year_dict['id'] = timelineid[i];
            timeline_data.unshift(year_dict);
        }
        timeline.series[0].data = timeline_data;
        Highcharts.chart('timeline',timeline);

        country_orig = activity[1];
        country_year = Object.keys(country_orig);
        for (i = 0;i<country_year.length;i++){
            info = country_orig[country_year[i]];
            currCountries = Object.keys(info);
            countries = [];
            countries_g = [];
            for (j = 0;j<currCountries.length;j++){
                first_val = parseFloat((parseFloat(info[currCountries[j]][0])*100).toFixed(3));
                second_val = parseFloat(info[currCountries[j]][1]);
                country_s = {};
                country_s['name'] = currCountries[j];
                country_s['value'] = first_val;
                countries.push(country_s);             
            }
            worldmap[country_year[i]] = countries;
        }
        tempWord = activity[2];
        wordCloudData = {};
        for(var i = 2005;i<=2015;i++){
          currentYear = tempWord[i.toString()];
          yearData = []
          for(var j =0;j<currentYear.length;j++){
            innerDict = {};
            innerDict['name'] = currentYear[j]['name'];
            innerDict['weight'] = currentYear[j]['weight'];
            yearData.push(innerDict)
          }
          wordCloudData[i.toString()] = yearData;
        }
      }
    
});



geomap = new Highcharts.mapChart('geomap', {
    chart: {
      map: 'custom/world',
      backgroundColor:'transparent'
    },
    title: {
        text: 'How Suicide Rate Differs Worldwide<br> From 2005 To 2015?',
        align: 'center',
        style:{
          color: '#FFFFFF'
        }
      },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom'
      }
    },
    subtitle:{
        text: "",
        useHTML : true,
        style:{
          color: '#FFFFFF'
        }
    },
    credits:{
        enabled: false,
    },
    colorAxis:{
        dataClasses: [{
          color: '#EEE89D',
          to: 0.5,
          name: '< 0.5‱',
      }, {
          color: '#EDCE8D',
          from: 0.5,
          to: 1,
          name: '0.5‱ - 1‱'
      }, {
        color: '#FC7750',
          from: 1,
          to: 1.5,
          name: '1‱ - 1.5‱'
      },{
        color: '#EC4542',
        from: 1.5,
        to: 2,
        name: '1.5‱ - 2‱'
    },{
      color: '#B4323C',
      from: 2,
      name: '> 2‱'
  }]
    },
    series: [{
      data: [],
      joinBy: ['name', 'name'],
      name: 'Suicide Rate (‱)',
      states: {
        hover: {
          color: '#a4edba'
        }
      }
    }]
});


lineChart = Highcharts.chart('lineChart', {
  chart:{
    backgroundColor:'transparent'
  },

  title: {
      text: ''
  },
  credits:{
    enabled: false,
  },
  subtitle: {
    enabled: false,
  },
  xAxis:{
    categories:['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015'],
    labels:{
      style:{
      color: '#FFFFFF'
    },
    }
  },
  yAxis: {
      title: {
          text: 'Suicide Rate (‱)',
          style:{
            color: '#FFFFFF'
          },
      },
      labels: {
        formatter: function(){
                    return (this.value*100).toFixed(3)+"‱"
        },
        style:{
          color: '#FFFFFF'
        },
        
      },
      
      min : 0.011,
      max: 0.0136
  },
  legend: {
     enabled: false,
  },
  tooltip: {
    headerFormat: '<b>Year:</b> <span style= "color: #ff0000"> {point.x} </span><br>',
    pointFormatter: function(){
        return '<span style="font-weight: normal; font-size: 6pt;" > '+'Suicide Rate: <b>'+(this.y*100).toFixed(3)+"‱" + "</b></span>";
    },
    enabled: false
},

  series: [{name:'suicide rate (‱)',data:[0,0,0,0,0,0,0,0,0,0,0],color:'red'}],

  responsive: {
      rules: [{
          condition: {
              maxWidth: 500
          },
          chartOptions: {
              legend: {
                  layout: 'horizontal',
                  align: 'center',
                  verticalAlign: 'bottom'
              }
          }
      }]
  }

});

wordCloud = Highcharts.chart('wordCloud', {
    chart:{
      backgroundColor: 'transparent'
    },
    series: [{
      type: 'wordcloud',
      data: [],
      name: 'Occurrences',
      
  }],
  credits:{
    enabled: false,
},
    title: {
        text: 'Which Age Group Has the Highest Suicide Rate <br> From 2005 To 2015?',
        verticalAlign:'middle'
    }
});