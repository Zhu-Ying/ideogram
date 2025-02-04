/**
 * @fileoverview Methods for processing chromosome length and banding data.
 *
 * Ideogram.js depicts chromosomes using data on their length, name, and
 * (if dealing with a very well-studied organism) cytogenetic banding data.
 * This file processes cytoband data that comes from biological research
 * institutions.
 *
 * For background on cytogenetic bands and how they are used in genomics, see:
 * https://ghr.nlm.nih.gov/primer/howgeneswork/genelocation
 *
 */

import naturalSort from 'es6-natural-sort';

import {
  drawBandLabels, getBandColorGradients, hideUnshownBandLabels, setBandsToShow,
  drawBandLabelText, drawBandLabelStalk
} from './draw';
import {parseBands} from './parse';

/**
 * TODO: Should this be in services/organism.js?
 */
function setTaxids(ideo) {
  var i, taxid, taxids;

  if (ideo.config.multiorganism === true) {
    ideo.coordinateSystem = 'bp';
    taxids = ideo.config.taxids;
    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];
    }
  } else {
    if (typeof ideo.config.taxid === 'undefined') {
      ideo.config.taxid = ideo.config.taxids[0];
    }
    taxid = ideo.config.taxid;
    taxids = [taxid];
    ideo.config.taxids = taxids;
  }

  return [taxid, taxids];
}

/**
 * Gets bands array for given chromosomes, sets ideo.maxLength
 */
function getBandsArray(chromosome, bandsByChr, taxid, ideo) {
  var bands, chrLength,
    bandsArray = [];

  bands = bandsByChr[chromosome];
  bandsArray.push(bands);

  chrLength = {
    iscn: bands[bands.length - 1].iscn.stop,
    bp: bands[bands.length - 1].bp.stop
  };

  if (taxid in ideo.maxLength === false) {
    ideo.maxLength[taxid] = {bp: 0, iscn: 0};
  }

  if (chrLength.iscn > ideo.maxLength[taxid].iscn) {
    ideo.maxLength[taxid].iscn = chrLength.iscn;
    if (chrLength.iscn > ideo.maxLength.iscn) {
      ideo.maxLength.iscn = chrLength.iscn;
    }
  }

  if (chrLength.bp > ideo.maxLength[taxid].bp) {
    ideo.maxLength[taxid].bp = chrLength.bp;
    if (chrLength.bp > ideo.maxLength.bp) {
      ideo.maxLength.bp = chrLength.bp;
    }
  }

  return bandsArray;
}

/**
 * Updates bandsArray, sets ideo.config.chromosomes and ideo.numChromosomes
 */
function setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo) {
  var bandData, bandsByChr, chromosome, k, chrBandsArray;

  bandData = ideo.bandData[taxid];

  bandsByChr = parseBands(bandData, taxid, chrs);

  chrs = Object.keys(bandsByChr).sort(function(a, b) {
    return naturalSort(a, b);
  });

  if (
    'chromosomes' in ideo.config === false ||
    ideo.config.chromosomes === null
  ) {
    ideo.config.chromosomes = {};
  }
  ideo.config.chromosomes[taxid] = chrs.slice();
  ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

  for (k = 0; k < chrs.length; k++) {
    chromosome = chrs[k];
    chrBandsArray = getBandsArray(chromosome, bandsByChr, taxid, ideo);
    bandsArray = bandsArray.concat(chrBandsArray);
  }

  return bandsArray;
}

function setChromosomesByTaxid(taxid, chrs, bandsArray, ideo) {
  var chr, k;

  if (ideo.coordinateSystem === 'iscn' || ideo.config.multiorganism) {
    bandsArray = setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo);
  } else if (ideo.coordinateSystem === 'bp') {
    // If lacking band-level data
    ideo.config.chromosomes[taxid] = chrs.slice();
    ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

    for (k = 0; k < chrs.length; k++) {
      chr = chrs[k];
      if (chr.length > ideo.maxLength.bp) ideo.maxLength.bp = chr.length;
    }
  }

  return bandsArray;
}

function reportPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in processBandData: ' + (t1 - t0) + ' ms');
  }
}

/**
 * Completes default ideogram initialization by calling downstream functions
 * to process raw band data into full JSON objects, render chromosome and
 * cytoband figures and labels, apply initial graphical transformations,
 * hide overlapping band labels, and execute callbacks defined by client code
 */
function processBandData() {
  var bandsArray, j, taxid, taxids, chrs,
    ideo = this,
    config = ideo.config,
    t0 = new Date().getTime();

  bandsArray = [];

  [taxid, taxids] = setTaxids(ideo);

  if ('chromosomes' in config) {
    if (config.multiorganism) {
      // Copy object
      chrs = config.chromosomes;
    } else {
      // Copy array by value
      chrs = config.chromosomes.slice();
    }
  }

  for (j = 0; j < taxids.length; j++) {
    taxid = taxids[j];
    bandsArray = setChromosomesByTaxid(taxid, chrs, bandsArray, ideo);
  }
  reportPerformance(t0, ideo);
  return bandsArray;
}

export {
  drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels, drawBandLabelText, drawBandLabelStalk
};
