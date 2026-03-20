/**
 * Spectra analytics tracker - browser entry point.
 *
 * Usage:
    
    Spectra.init({
      // Required
      accountId: 'spectra_test',
      // Optional
      debug: true,
      endpoint: 'http://localhost:8000/track',
    });

    Spectra.logEvent({...});

    Spectra.logEvent('page_view', {...});

 *   
 */

export * from './SpectraJS/index';