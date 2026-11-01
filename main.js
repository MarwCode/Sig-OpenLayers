import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Icon, Style } from 'ol/style.js';
import Overlay from 'ol/Overlay.js';

// Untuk menampilkan polygon Riau dengan data .json
const riau = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygon_riau.json'
  })
});

// Untuk menampilkan titik banjir dan icon
const banjir = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/banjir.json'
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'icon/flood.png',
      width: 32,
      height: 32
    })
  })
});

// Untuk menampilkan data hasil survei lapangan
const survey = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/survey.json'
  }),
  style: new Style({
    image: new Icon({
      src: 'icon/walkability.png',
      anchor: [0.5, 1],
      width: 32,
      height: 40
    })
  })
});

// Popup (harus di atas inisiasi map)
const container = document.getElementById('popup');
const content_element = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});


// const map = new Map({
//   target: 'map',
//   layers: [
//     new TileLayer({
//       source: new OSM(),
//     }),
//     riau,banjir
//   ],
//   overlays: [overlay], // tambah overlay popup
//   view: new View({
//     center: fromLonLat([101.438309, 0.510440]),
//     zoom: 7,
//   }),
// });

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    survey
  ],
  overlays: [overlay], // tambah overlay popup
  view: new View({
    center: fromLonLat([101.4386, 0.5403]),
    zoom: 13,
  }),
});

// JS for click popup
// map.on('singleclick', function (evt) {
//   const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
//     return feature;
//   });
//   if (!feature) {
//     return;
//   }
//   const coordinate = evt.coordinate;
//   const content = '<h3>Nama Daerah: ' + feature.get('Nama_Pemetaan') +
//     '</h3>' + '<p>Jumlah Korban: ' + feature.get('Jumlah_Korban') + '</p>';
//   content_element.innerHTML = content;
//   overlay.setPosition(coordinate);
// });

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature) { return feature; },
    { layerFilter: function (layer) { return layer === survey; } }
  );
  if (!feature) {
    return;
  }

  const coordinate = evt.coordinate;

  // Ambil nama file foto dari atribut (sesuaikan nama field-nya)
  const raw = (feature.get('pdfmaps_photos') || '') + (feature.get('description') || '');
  const match = raw.match(/src="([^"]+)"/);
  let fotoHtml = '';
  if (match) {
    const namaFile = match[1].split(/[\\/]/).pop();
    fotoHtml = '<img src="foto/' + encodeURI(namaFile) +
      '" style="width:100%; border-radius:6px; margin-top:8px;">';
  }

  const content = '<h3>' + feature.get('name') + '</h3>' + fotoHtml;
  content_element.innerHTML = content;
  overlay.setPosition(coordinate);
});

// Click handler to hide popup
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};
