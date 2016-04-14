(function() {
  let currentService, currentPlatform;

  const serviceLinks = $$('.service-select a');
  const platformLinks = $$('.platform-select a');

  // Header animation
  // setInterval(function() {
  //   let serviceLink = serviceLinks[Math.floor(Math.random()*serviceLinks.length)];
  //   let platformLink = platformLinks[Math.floor(Math.random()*platformLinks.length)];
  //   $('.getstarted-heading__service').innerHTML = serviceLink.getAttribute('data-name');
  //   $('.getstarted-heading__platform').innerHTML = platformLink.getAttribute('data-name');
  // }, 1000)

  // Click handlers for services/platforms
  let addClickHandlers = function(links, type) {
    Array.prototype.forEach.call(links, link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if(type === 'service') currentService = {name: e.currentTarget.getAttribute('data-name'), doc: e.currentTarget.getAttribute('data-doc')};
        if(type === 'platform') currentPlatform = {name: e.currentTarget.getAttribute('data-name'), doc: e.currentTarget.getAttribute('data-doc')};
        nextStep();
      });
    })
  }

  // Setup initial values
  addClickHandlers(serviceLinks, 'service');
  addClickHandlers(platformLinks, 'platform');
  $('.step1').setAttribute('style', 'pointer-events: none;');
  $('.step2').setAttribute('style', 'pointer-events: none;');

  // Convenience method to find a link
  let findItemIn = function(links, term) {
    return Array.prototype.find.call(links, link => { return link.getAttribute('data-name').toLowerCase() === term});
  }

  // Set values back when you click on the first step
  $('.step1').addEventListener('click', function(e) {
    e.preventDefault();
    $('.step1').setAttribute('style', 'pointer-events: none;');
    $('.step2').setAttribute('style', 'pointer-events: none;');
    $('.step1 h3').innerHTML = 'Select a service';
    $('.step2 h3').innerHTML = 'Select a platform';

    $('.service-select').removeAttribute('style');
    $('.platform-select').setAttribute('style', 'display: none;');
    $('.install').setAttribute('style', 'display: none;');

    $('.step1').removeClassName('step-inactive');
    $('.step2').addClassName('step-inactive');
    $('.step3').addClassName('step-inactive');

    $('.arrow-container').removeClassName('step2').removeClassName('step3').addClassName('step1')

    currentService = undefined;
    currentPlatform = undefined;
    window.location.hash = '!';
  });

  // Set values back when you click on the second step
  $('.step2').addEventListener('click', function(e) {
    e.preventDefault();
    $('.step2').setAttribute('style', 'pointer-events: none;');
    $('.step2 h3').innerHTML = 'Select a platform';

    $('.platform-select').removeAttribute('style');
    $('.install').setAttribute('style', 'display: none;');

    $('.step2').removeClassName('step-inactive');
    $('.step3').addClassName('step-inactive');

    $('.arrow-container').removeClassName('step3').addClassName('step2')

    currentPlatform = undefined;

    window.location.hash = `${currentService.name}`.toLowerCase();
  });

  // Returns the actual md files
  let getDocs = function(servicePath, platformPath) {
    return new Promise(function(resolve, reject) {
      let serviceDoc, platformDoc;
      let gotADoc = function () {
        if(serviceDoc != undefined && platformDoc != undefined) resolve({service: serviceDoc, platform: platformDoc});
      }

      fetch(`/get-started-docs/${servicePath}/`)
        .then(response => response.text())
        .then(body => {
          serviceDoc = body;
          gotADoc()
        })

      fetch(`/get-started-docs/${platformPath}/`)
        .then(response => response.text())
        .then(body => {
          platformDoc = body;
          gotADoc()
        })
    })
  }

  // Go to a specific step
  let step = function(cur) {
    if(cur === 1) {
      // show platform
      $('.service-select').setAttribute('style', 'display: none;');
      $('.platform-select').removeAttribute('style');
      $('.install').setAttribute('style', 'display: none;');
      $('.step1').removeAttribute('style');

      $('.step1').addClassName('step-inactive');
      $('.step2').removeClassName('step-inactive');

      $('.arrow-container').removeClassName('step1').addClassName('step2')

      $('.step1 h3').innerHTML = currentService.name;
      window.location.hash = `${currentService.name}`.toLowerCase();
    } else if(cur === 2) {
      // show docs
      $('.service-select').setAttribute('style', 'display: none;');
      $('.platform-select').setAttribute('style', 'display: none;');
      $('.install').removeAttribute('style');
      $('.step2').removeAttribute('style');

      $('.step1').addClassName('step-inactive');
      $('.step2').addClassName('step-inactive');
      $('.step3').removeClassName('step-inactive');

      $('.arrow-container').removeClassName('step2').addClassName('step3')

      $('.step1 h3').innerHTML = currentService.name;
      $('.step2 h3').innerHTML = currentPlatform.name;
      window.location.hash = `${currentService.name}+${currentPlatform.name}`.toLowerCase();

      getDocs(currentService.doc, currentPlatform.doc)
        .then(docs => {
          $('.install').innerHTML = `${docs.platform}<div class="install-arrow"></div>${docs.service}`;
        })
    }
  }

  // Set the next step depending on what has been selected
  let nextStep = function () {
    if(currentService != undefined && currentPlatform === undefined) {
      step(1);
    } else if(currentService != undefined && currentPlatform != undefined) {
      step(2);
    }
  }

  // Set the steps according to the location hash
  if(window.location.hash != "") {
    let serviceHash = window.location.hash.split('+')[0].substr(1);
    let platformHash = window.location.hash.split('+')[1];
    if(serviceHash) {
      let result = findItemIn(serviceLinks, serviceHash);
      if(result) currentService = {name: result.getAttribute('data-name'), doc: result.getAttribute('data-doc')};
      $('.step1').removeAttribute('style');
    }
    if(platformHash) {
       let result = findItemIn(platformLinks, platformHash);
       if(result) currentPlatform = {name: result.getAttribute('data-name'), doc: result.getAttribute('data-doc')};
       $('.step2').removeAttribute('style');
    }
    nextStep();
  }

})();
