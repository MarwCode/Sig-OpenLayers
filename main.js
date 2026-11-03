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

const kabRiau = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'data/kab_riau.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'FID'],
      1,
      '#ffff33',
      13,
      '#3358ff',
    ],
  },
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

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    kabRiau, banjir, survey
  ],
  view: new View({
    center: fromLonLat([101.438309, 0.510440]),
    zoom: 8,
  }),
});

// Tugas 2: popup (harus di bawah konstanta map)
const popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15]
});
map.addOverlay(popup);

map.on('singleclick', function (evt) {
  const hasil = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature, layer) { return { feature, layer }; }
  );

  if (hasil) {
    const feature = hasil.feature;
    let content = '';

    if (hasil.layer === survey) {
      // Titik survei: nama + foto
      const raw = (feature.get('pdfmaps_photos') || '') + (feature.get('description') || '');
      const match = raw.match(/src="([^"]+)"/);
      let fotoHtml = '';
      if (match) {
        const namaFile = match[1].split(/[\\/]/).pop();
        fotoHtml = '<img src="foto/' + encodeURI(namaFile) +
          '" style="width:100%; border-radius:6px; margin-top:8px;">';
      }
      content = '<h3>' + feature.get('name') + '</h3>' + fotoHtml;
    } else if (hasil.layer === banjir) {
      // Titik banjir
      content = '<h3>Informasi Fitur</h3>';
      content += '<p>Nama Daerah: <strong>' + feature.get('Nama_Pemetaan') +
        '</strong></p>' + '<p>Jumlah Korban: ' + feature.get('Jumlah_Korban') + '</p>';
    } else {
      // Polygon kabupaten
      content = '<h3>' + (feature.get('Kabupaten') || 'Wilayah Riau') + '</h3>';
    }

    document.getElementById('popup-content').innerHTML = content;
    popup.setPosition(evt.coordinate);
  } else {
    popup.setPosition(undefined);
  }
});

document.getElementById('popup-closer').onclick = function () {
  popup.setPosition(undefined);
  return false;
};

// Tugas 3: highlight polygon saat di-hover
const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});

let highlight;

const highlightFeature = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }
};

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
    return feat;
  });

  const info = document.getElementById('info');

  if (feature) {
    info.innerHTML = feature.get('Kabupaten') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
};

// Langkah 7: event pergerakan pointer
map.on('pointermove', function (evt) {
  if (evt.dragging) {
    popup.setPosition(undefined);
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  highlightFeature(pixel);
  displayFeatureInfo(pixel);
});

// Langkah 8: kontrol visibilitas layer dengan checkbox
const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');

const surveyLayerCheckbox = document.getElementById('survey');

surveyLayerCheckbox.addEventListener('change', function () {
  survey.setVisible(surveyLayerCheckbox.checked);
});

polygonLayerCheckbox.addEventListener('change', function () {
  kabRiau.setVisible(polygonLayerCheckbox.checked);
});

pointLayerCheckbox.addEventListener('change', function () {
  banjir.setVisible(pointLayerCheckbox.checked);
});