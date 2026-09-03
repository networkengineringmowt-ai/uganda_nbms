function i(t,a){const o=URL.createObjectURL(t),n=document.createElement("a");n.href=o,n.download=a,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(o)}const c=["id","name","type","road","roadNumber","region","chainage","lat","lng","spanLength","noOfSpans","noOfLanes","noOfPiers","width","material","crossingType","surfaceType","yearBuilt","maintenanceArea","river","conditionRating","lastInspection","nextInspection","inspectionDue","traffic","priorityRank","estimatedReplacementCost"];function s(t){if(t==null)return"";const a=String(t);return a.includes(",")||a.includes('"')||a.includes(`
`)?'"'+a.replace(/"/g,'""')+'"':a}function m(t,a="structures.csv"){const o=c.join(","),n=t.map(r=>c.map(p=>s(r[p])).join(",")),e=[o,...n].join(`
`);i(new Blob([e],{type:"text/csv;charset=utf-8"}),a)}function u(t,a="structures.geojson"){const o={type:"FeatureCollection",features:t.map(e=>({type:"Feature",geometry:{type:"Point",coordinates:[e.lng,e.lat]},properties:{id:e.id,name:e.name,type:e.type,road:e.road,road_number:e.roadNumber,region:e.region,chainage_km:e.chainage,span_m:e.spanLength,n_spans:e.noOfSpans,n_lanes:e.noOfLanes,width_m:e.width,material:e.material,crossing:e.crossingType,surface:e.surfaceType,year_built:e.yearBuilt,condition:e.conditionRating,last_inspection:e.lastInspection,priority_rank:e.priorityRank,traffic:e.traffic,maint_area:e.maintenanceArea,river:e.river}}))},n=new Blob([JSON.stringify(o,null,2)],{type:"application/geo+json"});i(n,a)}const d={1:"ff2222ff",2:"ff4488ff",3:"ff00aaff",4:"ff00ff88",5:"ff00cc44"};function f(t,a="structures.kml"){const o=t.map(e=>{const r=d[e.conditionRating]??"ffffffff";return`  <Placemark>
    <name>${l(e.name)}</name>
    <description><![CDATA[
      <b>Type:</b> ${e.type}<br/>
      <b>Road:</b> ${l(e.road)}<br/>
      <b>Chainage:</b> ${e.chainage} km<br/>
      <b>Region:</b> ${e.region}<br/>
      <b>Year Built:</b> ${e.yearBuilt}<br/>
      <b>Condition:</b> ${e.conditionRating}/5<br/>
      <b>Material:</b> ${e.material}
    ]]></description>
    <Style><IconStyle><color>${r}</color>
      <Icon><href>https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
    </IconStyle></Style>
    <Point><coordinates>${e.lng},${e.lat},0</coordinates></Point>
  </Placemark>`}).join(`
`),n=`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>Uganda National Road Structures</name>
  <description>Department of National Roads Bridge and Major Culvert Inventory — ${t.length} structures</description>
${o}
</Document>
</kml>`;i(new Blob([n],{type:"application/vnd.google-earth.kml+xml"}),a)}function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function g(t="all"){const o={all:"/downloads/structures_all.zip",bridges:"/downloads/structures_bridges.zip",culverts:"/downloads/structures_culverts.zip"}[t],n=document.createElement("a");n.href=o,n.download=`structures_${t}.zip`,document.body.appendChild(n),n.click(),n.remove()}export{f as a,g as b,m as c,u as d};
