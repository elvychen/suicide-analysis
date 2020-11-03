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
              if (chart.renderTo!==histogram){
                event = chart.pointer.normalize(e);
                point = chart.series[0].searchPoint(event, true);
              }
              // Get the hovered point
              if (point) {
                if(histogram.xAxis[0].visible == false){
                  histogram.xAxis[0].update({visible:true});
                  histogram.yAxis[0].update({visible:true});
                }
                
                if (chart.renderTo.id == "timeline"){
                  var data = worldmap[point.id];
                  geomap.setTitle({'text':'East Europe, Central Asia, Japan and South Korea Have Higher Suicide Rates'},{'text':point.id+' Worldwide Suicide Rate Distribution'});
                  geomap.series[0].update({'data':data});

                  lineChart.tooltip.update({enabled:true})
                  lineChart.series[0].setData(getRateLine(point.id));
                  histogram.setTitle({'text': '35-54 Age Group Has Highest Suicide Rate','verticalAlign':'top'},{'text':'Suicide Rate For Each Age Group ( ' + point.id +' )','verticalAlign': 'top'});
                  histogram.series[0].update({'data': histData[point.id.toString()]});
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
    style:{
      fontFamily:"de-walpergens-pica, serif",
    }
  },
  xAxis: {
    type: 'datetime',
    visible: false,
    labels: {
      format: '{value:%Y}'
    },
    style:{
      fontFamily:"de-walpergens-pica, serif",
      
    }
  },
  yAxis: {
    gridLineWidth: 1,
    title: null,
    labels: {
      enabled: false
    },
    style:{
      fontFamily:"de-walpergens-pica, serif",
    }
  },
  legend: {
    enabled: false
  },
  credits:{
      enabled: false,
  },
  title: {
    text: "Suicide Rate Is in Decreasing Trend from 2005 to 2015",
    style:{
      fontSize:'30px',
      fontFamily:"de-walpergens-pica, serif",
    }
    
  },
  subtitle: {
      text: 'Overall Suicide Rate From 2005 To 2015',
      style:{
        fontSize:'20px',
        fontFamily:"de-walpergens-pica, serif",
      }
  },
  tooltip: {
    enabled: false,
  },
  series: [{
    dataLabels: {
      style:{
        opacity:0.9,
        fontSize:'16px',
        fontFamily:"de-walpergens-pica, serif",
        
      },
      allowOverlap: true,
      formatter: function(){
            var date = Highcharts.dateFormat('%Y',this.x);
            // var rate = this.point.label
            return '<span style="color:'+this.point.color+'">● </span><span style="font-weight: bold;" > ' +
                  date+'</span>: '+
                  '<span style="font-weight: normal; font-size: 12px;" ><b>'+(this.point.label*100).toFixed(3)+"‱" + "</b></span>";
      },
      
    },
    marker: {
      symbol: 'circle',

    },
    data: [],
  }]
}

function changeConclusion(){
  var x = document.getElementById('currentTable');
  var y = document.getElementById('conclusion_text');

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
var pieData = {};

Highcharts.ajax({
  url:'./assets/dataset1.json',
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
              first_val = parseFloat((parseFloat(info[currCountries[j]])*100).toFixed(3));
              country_s = {};
              country_s['name'] = currCountries[j];
              country_s['value'] = first_val;
              countries.push(country_s);             
          }
          worldmap[country_year[i]] = countries;
      }
      tempWord = activity[2];
      histData = {}
      for(var i = 2005;i<=2015;i++){
        currentYear = tempWord[i.toString()];

        histData_inner = []
        for(var j =0;j<currentYear.length;j++){

          histData_inner.push(currentYear[j]['weight']);
        }
        const index = [3,0,1,2,4,5];
        const output = index.map(i => histData_inner[i])
        output[3] = {y:output[3],color: 'rgb(165,42,42,0.8)'}
        histData[i.toString()] = output;
      }
      pieData = activity[3];
      
    }
    
  
});



geomap = new Highcharts.mapChart('geomap', {
  chart: {
    map: 'custom/world',
    backgroundColor:'transparent',
    plotBackgroundColor: 'rgb(0,105,148,0.2)',
    style:{
      fontFamily:"de-walpergens-pica, serif",
    }
  },
  title: {
      text: 'How Suicide Rate Differs Worldwide<br> From 2005 To 2015?',
      align: 'center',
      style:{
        fontSize:'24px',
        fontFamily:"de-walpergens-pica, serif",
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
        fontSize:'20px',
        fontFamily:"de-walpergens-pica, serif",
      }
  },
  credits:{
      enabled: false,
  },
  colorAxis:{
      dataClasses: [{
        color: '#EEE89D',
        to: 0.5,
        name: '<span style="font-size:16px">< 0.5‱ </span>',
    }, {
        color: '#EDCE8D',
        from: 0.5,
        to: 1,
        name: '<span style="font-size:16px">0.5‱ - 1‱</span>'
    }, {
      color: '#FC7750',
        from: 1,
        to: 1.5,
        name: '<span style="font-size:16px">1‱ - 1.5‱</span>'
    },{
      color: '#EC4542',
      from: 1.5,
      to: 2,
      name: '<span style="font-size:16px">1.5‱ - 2‱</span>'
  },{
    color: '#B4323C',
    from: 2,
    name: '<span style="font-size:16px">> 2‱</span>'
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
    },
    opacity:0.9
  }]
});


lineChart = Highcharts.chart('lineChart', {
chart:{
  backgroundColor:'transparent',
  style:{
    fontFamily:"de-walpergens-pica, serif",
  }
},

title: {
    text: '',
    style:{
      fontSize:'30px',
      fontFamily:"de-walpergens-pica, serif",
    }
},
credits:{
  enabled: false,
},
subtitle: {
  text:'',
  style:{
    fontSize:'20px',
    fontFamily:"de-walpergens-pica, serif",
  }
},
xAxis:{
  categories:['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015'],
  labels:{
    style:{
      fontSize:'20px',
      fontFamily:"de-walpergens-pica, serif",
    }
  }
},
yAxis: {
    title: {
        text: 'Suicide Rate (‱)', 
    },
    labels: {
      formatter: function(){
                  return (this.value*100).toFixed(3)+"‱"
      },
      style:{
        fontSize:'16px',
        fontFamily:"de-walpergens-pica, serif",
      }
      
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
      return '<span style="font-weight: normal; font-size: 12px;" > '+'Suicide Rate: <b>'+(this.y*100).toFixed(3)+"‱" + "</b></span>";
  },
  enabled: false
},

series: [{name:'suicide rate (‱)',
data:[0,0,0,0,0,0,0,0,0,0,0],
color:'rgb(165,42,42,0.8)',
opacity:0.9}],

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




histogram = Highcharts.chart('histogram', {
  chart: {
    type: 'column',
    backgroundColor: 'transparent',
    style:{
      fontFamily:"de-walpergens-pica, serif",
    }
    
  },
  title: {
    text: 'Which Age Group Has the Highest Suicide Rate?', 
    align:'center',
    verticalAlign:'middle',
    style:{
      fontSize:'30px',
      fontFamily:"de-walpergens-pica, serif",
    }
  },
  subtitle: {
    text: '',
    style:{
      fontSize:'20px',
      fontFamily:"de-walpergens-pica, serif",
    }
  },
  credits:{
    enabled: false
  },
  xAxis: {
    categories: [
      '<span style="font-size:16px">5-14 years</span>',
      '<span style="font-size:16px">15-24 years</span>',
      '<span style="font-size:16px">25-34 years</span>',
      '<span style="font-size:16px">35-54 years</span>',
      '<span style="font-size:16px">55-74 years</span>',
      '<span style="font-size:16px">75+ years</span>'
    ],
    visible:false,
  },
  legend:{
    enabled: false
  },
  yAxis: {
    min: 0,
    title: {
      text: 'Percentage (%)',
      style:{
        fontSize:'16px',
        fontFamily:"de-walpergens-pica, serif",
      }
      
    },
    visible: false,
    labels:{
      style:{
      fontSize:'20px',
      fontFamily:"de-walpergens-pica, serif",
    }
    }
  },
  tooltip: {
    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
    pointFormat: '<td style="padding:0"><b>{point.y:.1f}%</b></td></tr>',
    footerFormat: '</table>',
    shared: true,
    useHTML: true
  },
  plotOptions: {
    column: {
      pointPadding: 0,
      borderWidth: 0,
      groupPadding: 0,
      shadow: false
    }
  },
  series: [{
    name: 'Age Group',
    data: [],
    opacity:0.9,
    color: '#EDCE8D'

  }]
  });