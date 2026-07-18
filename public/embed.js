// (function () {
//   if (window.__quoteWidgetInitialized) return;
//   window.__quoteWidgetInitialized = true;

//   // ---  Create the trigger button ---
//   const openButton = document.createElement("button");
//   openButton.innerText = "Open Quote Widget";
//   openButton.style.cssText = `
//     background: #4f46e5;
//     color: white;
//     padding: 10px 18px;
//     border: none;
//     border-radius: 8px;
//     cursor: pointer;
//     font-size: 16px;
//     margin: 30px;
//     box-shadow: 0 2px 8px rgba(0,0,0,0.2);
//   `;
//   document.body.appendChild(openButton);

//   // ---  Create the modal overlay ---
//   const modalOverlay = document.createElement("div");
//   modalOverlay.id = "quote-widget-modal";
//   modalOverlay.style.cssText = `
//     display: none;
//     position: fixed;
//     top: 0; left: 0;
//     width: 100vw; height: 100vh;
//     background: rgba(0,0,0,0.6);
//     z-index: 9999;
//     justify-content: center;
//     align-items: center;
//   `;
//   document.body.appendChild(modalOverlay);

//   // ---  Create the modal content box ---
//   const modalContent = document.createElement("div");
//   modalContent.style.cssText = `
//     position: relative;
//     width: 80%;
//     height: 85%;
//     background: white;
//     border-radius: 12px;
//     overflow: hidden;
//     box-shadow: 0 5px 25px rgba(0,0,0,0.4);
//   `;
//   modalOverlay.appendChild(modalContent);

//   // ---  Add close button ---
//   const closeButton = document.createElement("button");
//   closeButton.innerText = "×";
//   closeButton.style.cssText = `
//     position: absolute;
//     top: 10px;
//     right: 15px;
//     font-size: 28px;
//     background: none;
//     border: none;
//     cursor: pointer;
//     color: #333;
//   `;
//   modalContent.appendChild(closeButton);

//   // ---  Add the iframe (your existing widget) ---
//   const iframe = document.createElement("iframe");
//   iframe.src = "http://localhost:4000/#/widget";
//   iframe.style.cssText = `
//     width: 100%;
//     height: 100%;
//     border: none;
//     border-radius: 12px;
//   `;
//   modalContent.appendChild(iframe);

//   // ---  Open and close logic ---
//   openButton.addEventListener("click", () => {
//     modalOverlay.style.display = "flex";
//   });

//   closeButton.addEventListener("click", () => {
//     modalOverlay.style.display = "none";
//   });

//   modalOverlay.addEventListener("click", (e) => {
//     if (e.target === modalOverlay) {
//       modalOverlay.style.display = "none";
//     }
//   });
// })(); 


(function () {
  if (window.QuoteWidget) return; // prevent reinit

  // --- Private modal creation logic ---
  function createModal() {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "quote-widget-modal";
    modalOverlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6);
      z-index: 9999;
      justify-content: center;
      align-items: center;
    `;
    document.body.appendChild(modalOverlay);

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      position: relative;
      width: 80%;
      height: 80%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 25px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    `;
    modalOverlay.appendChild(modalContent);

    const closeButton = document.createElement("button");
    closeButton.innerText = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 28px;
      background: none;
      border: none;
      cursor: pointer;
      color: #333;
    `;
    modalContent.appendChild(closeButton);

    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:4000/#/widget"; // your React widget
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
    `;
    modalContent.appendChild(iframe);

    closeButton.addEventListener("click", () => {
      modalOverlay.style.display = "none";
    });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = "none";
      }
    });

    return modalOverlay;
  }

  // Create modal once and reuse it
  const modal = createModal();

  // --- Expose global object ---
  window.QuoteWidget = {
    open: function () {
      modal.style.display = "flex";
    },
    close: function () {
      modal.style.display = "none";
    },
  };
})();
