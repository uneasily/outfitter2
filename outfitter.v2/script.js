document.addEventListener('DOMContentLoaded', () => {
    const addClothesButton = document.getElementById('add_clothes');
    const closePopupButton = document.getElementById('close-popup');
    const popupButton = document.getElementById('popup-button');
    const randomizeOutfitButton = document.getElementById('randomize_outfit');
    const popup = document.getElementById('popup');
    const dropdown = document.getElementById('dropdown');
    const contentFrame = document.getElementById('content-frame');
    const progressBar = document.querySelector('#progress-bar');
    const preloader = document.querySelector('#preloader');
    const mainframe = document.querySelector('#mainframe');
    const saveOutfitButton = document.getElementById('save_outfit');
    const loadOutfitButton = document.getElementById('load_outfit');

    // Fetch the clothes paths from the JSON file
    let clothesPaths = {};
    let totalImages = 0;
    let loadedImages = 0;

    fetch('https://raw.githubusercontent.com/uneasily/clothes/main/clothess.json')
        .then(response => response.json())
        .then(data => {
            clothesPaths = data;
            // Count total images to preload
            totalImages = Object.values(clothesPaths).reduce((acc, paths) => acc + paths.length, 0);

            // Preload images
            const imagePromises = [];
            for (const [className, paths] of Object.entries(clothesPaths)) {
                paths.forEach(image => {
                    const img = new Image();
                    img.src = `./${className}/${image}`;
                    img.onload = () => {
                        loadedImages++;
                        // Update the progress bar
                        const progress = (loadedImages / totalImages) * 100;
                        progressBar.style.width = `${progress}%`;

                        if (loadedImages === totalImages) {
                            // Fade out the preloader and show the content
                            setTimeout(() => {
                                preloader.style.opacity = '0';
                                preloader.style.transition = 'opacity 1s ease-in-out';
                                mainframe.style.opacity = '1';
                                // Remove preloader element from the DOM
                                preloader.addEventListener('transitionend', () => {
                                    preloader.remove();
                                });
                            }, 500); // Delay to allow progress bar to finish

                            // Ensure that after fade out, the content is visible
                            mainframe.style.display = 'flex';
                        }
                    };
                    img.onerror = () => {
                        console.error(`Failed to load image ${img.src}`);
                    };
                    imagePromises.push(img);
                });
            }
            return Promise.all(imagePromises);
        })
        .catch(error => {
            console.error('Error fetching clothes data:', error);
        });

    // Function to delete a frame
    function deleteFrame(e) {
        e.preventDefault(); // Prevent the default context menu
        e.stopPropagation(); // Prevent triggering other events
        const frame = e.currentTarget;
        frame.remove(); // Remove the frame from the content frame
    }

    // Function to add a new frame
    function addNewFrame(src, locked = false) {
        const newFrame = document.createElement('div');
        newFrame.className = 'frame';
        newFrame.style.left = `0px`; // Set initial position
        newFrame.style.top = `0px`; // Set initial position
        if (locked) {
            newFrame.dataset.locked = 'true'; // Lock the frame
        }

        // Create and add an image to the frame
        const img = document.createElement('img');
        img.src = src; // Set the path for the image
        img.alt = src.split('/')[1].split('/')[0]; // Set alt text based on image name

        // Create and add a checkbox to the frame
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox';
        if (locked) {
            checkbox.classList.add('checked');
        }
        checkbox.addEventListener('click', (event) => {
            checkbox.classList.toggle('checked');
            if (checkbox.classList.contains('checked')) {
                newFrame.dataset.locked = 'true'; // Lock the frame
            } else {
                delete newFrame.dataset.locked; // Unlock the frame
            }
            event.stopPropagation(); // Prevent triggering the drag event
        });

        // Add the checkbox to the frame
        newFrame.appendChild(checkbox);

        // Add event listener for right-click
        newFrame.addEventListener('contextmenu', deleteFrame);

        // Append image to the frame
        newFrame.appendChild(img);

        // Append the new frame to the content frame
        contentFrame.appendChild(newFrame);

        // Make the frame draggable
        makeDraggable(newFrame);

        return newFrame;
    }

    // Function to save the outfit
    function saveOutfit() {
        const outfit = Array.from(document.querySelectorAll('.frame')).map(frame => {
            const img = frame.querySelector('img');
            return {
                alt: img.alt,
                image: img.src,
                left: frame.style.left,
                top: frame.style.top,
                locked: frame.dataset.locked === 'true'
            };
        });

        // Convert to JSON
        const outfitJSON = JSON.stringify(outfit, null, 2);

        // Print to the console
        console.log(outfitJSON);
        alert('Saved outfit! Check console.')
    }

    // Function to load the outfit
    function loadOutfit() {
        const jsonString = prompt('Paste the saved outfit JSON here:'); // Prompt user for JSON input
        if (jsonString) {
            try {
                const outfit = JSON.parse(jsonString); // Parse the JSON string

                // Clear existing frames
                contentFrame.innerHTML = '';

                outfit.forEach(item => {
                    if (item.image) {
                        addNewFrame(item.image, item.locked)
                            .style.left = item.left || '0px'; // Set position
                        addNewFrame(item.image, item.locked)
                            .style.top = item.top || '0px'; // Set position
                    }
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        }
    }

    // Fixed Randomize the outfit function
    function randomizeOutfit() {
        // Iterate through all draggable frames
        document.querySelectorAll('.frame').forEach(frame => {
            if (frame.dataset.locked) {
                return; // Skip locked frames
            }
            const img = frame.querySelector('img');
            if (img) {
                const currentAlt = img.alt; // Get the class of clothing
                const imagePaths = clothesPaths[currentAlt]; // Get the paths for this class
                if (imagePaths) {
                    const randomImagePath = './' + currentAlt + '/' + imagePaths[Math.floor(Math.random() * imagePaths.length)];
                    img.src = randomImagePath; // Update the image source
                    img.onload = () => {
                        img.style.width = '100%'; // Make sure the image width is 100% of the frame width
                        img.style.height = 'auto'; // Maintain the aspect ratio

                        // Update the frame's position to ensure it's within the content frame
                        const maxX = contentFrame.clientWidth - frame.offsetWidth;
                        const maxY = contentFrame.clientHeight - frame.offsetHeight;
                        frame.style.left = `${Math.min(Math.max(0, frame.offsetLeft), maxX)}px`;
                        frame.style.top = `${Math.min(Math.max(0, frame.offsetTop), maxY)}px`;
                    };
                    img.onerror = () => {
                        console.error(`Image for ${currentAlt} failed to load.`);
                    };
                } else {
                    console.error(`No image paths available for ${currentAlt}`);
                }
            }
        });
    }

    // Add event listener for the 'Add Clothes' button to open the popup
    addClothesButton.addEventListener('click', () => {
        popup.style.display = 'block';
    });

    // Add event listener for the 'Close Popup' button to close the popup
    closePopupButton.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    // Add event listener for the 'Submit' button in the popup
    popupButton.addEventListener('click', () => {
        const selectedValue = dropdown.value;
        if (selectedValue && clothesPaths[selectedValue]) {
            // Choose a random image from the selected article paths
            const imagePaths = clothesPaths[selectedValue];
            const randomImagePath = './' + selectedValue + '/' + imagePaths[Math.floor(Math.random() * imagePaths.length)];

            // Add a new frame with the selected image
            addNewFrame(randomImagePath);

            // Close the popup
            popup.style.display = 'none';
        } else {
            console.error(`No images available for ${selectedValue}`);
        }
    });

    // Add event listener for the 'Randomize Outfit' button
    randomizeOutfitButton.addEventListener('click', randomizeOutfit);

    // Add event listener for the 'Save Outfit' button
    saveOutfitButton.addEventListener('click', saveOutfit);

    // Add event listener for the 'Load Outfit' button
    loadOutfitButton.addEventListener('click', loadOutfit);

    // Function to make an element draggable
    function makeDraggable(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        elmnt.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Calculate the new top and left positions
            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            // Constrain the frame to the content frame
            const maxX = contentFrame.clientWidth - elmnt.offsetWidth;
            const maxY = contentFrame.clientHeight - elmnt.offsetHeight;
            newLeft = Math.min(Math.max(newLeft, 0), maxX);
            newTop = Math.min(Math.max(newTop, 0), maxY);

            elmnt.style.top = `${newTop}px`;
            elmnt.style.left = `${newLeft}px`;
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }

        // Bring the clicked frame to the top
        elmnt.addEventListener('mousedown', () => {
            elmnt.style.zIndex = 1000;
        });

        // Reset zIndex when dragging ends
        elmnt.addEventListener('mouseup', () => {
            elmnt.style.zIndex = '';
        });
    }
});
