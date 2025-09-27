function findComposeToolBar(){
    const selectors =[
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up',
        'T-I J-J5-Ji hG T-I-atl L3',
        'J-J5-Ji btA',
        'dC',
        'T-I J-J5-Ji aoO v7 T-I-atl L3',
        'G-asx'
    ];

    for(const selector of selectors){
        const toolbar = document.querySelector(selector);
        if(toolbar){
            return toolbar
        }
        return null;
    }
}

function createAutoReplyButton() {
    // Wrapper for left + right
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.position = 'relative';
    wrapper.style.marginRight = '6px';
    wrapper.style.userSelect = 'none';
    wrapper.selectedTone = 'Friendly'; // default tone

    // Left side: main Auto-Reply button
    const button = document.createElement('div');
    button.textContent = 'Auto-Reply';
    button.style.fontSize = '15px';
    button.style.color= '#fff'
    button.style.padding = '8px 18px';
    button.style.cursor = 'pointer';
    button.style.background = '#1B61D1';
    button.style.borderTopLeftRadius = '50px';
    button.style.borderBottomLeftRadius = '50px';

    // Right side: chevron
    const chevron = document.createElement('div');
    chevron.textContent = '▼';
    chevron.style.color = '#fff'
    chevron.style.fontSize = '15px';
    chevron.style.padding = '8px 18px';
    chevron.style.cursor = 'pointer';
    chevron.style.background = '#1B61D1';
    chevron.style.borderLeft = '1px solid #ccc';
    chevron.style.borderTopRightRadius = '50px';
    chevron.style.borderBottomRightRadius = '50px';

    wrapper.appendChild(button);
    wrapper.appendChild(chevron);

    // Dropdown menu appended to body
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.minWidth = '140px';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    menu.style.padding = '4px 0';
    menu.style.display = 'none';
    menu.style.zIndex = '9999';
    document.body.appendChild(menu);

    // Dropdown options
    ['Friendly', 'Professional', 'Casual','Agitated'].forEach(tone => {
        const item = document.createElement('div');
        item.textContent = tone;
        item.style.padding = '6px 12px';
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.selectedTone = tone;
            menu.style.display = 'none';
        });
        menu.appendChild(item);
    });

    // Chevron click toggles menu
    chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = chevron.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    // Clicking outside closes menu
    document.addEventListener('click', () => {
        menu.style.display = 'none';
    });

    return { wrapper, button }; // ✅ always return both
}




function getEmailContent(){
    const selectors =[
        '.h7',
        '.a3s.aiL',
        'gmail_quote',
        '[role="presentation"]'
    ];

    for(const selector of selectors){
        const content = document.querySelector(selector);
        if(content){
            return content.innerText.trim();
        }
        return null;
    }
}


function injectButton() {
    const existingButton = document.querySelector('.auto-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolBar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }
    console.log("Toolbar Found!");

    const { wrapper, button } = createAutoReplyButton();
    wrapper.classList.add('auto-reply-button');

    button.addEventListener('click', async () => {
        try {
            button.textContent = 'Generating...';
            button.style.pointerEvents = 'none';

            const emailContent = getEmailContent();
            if (!emailContent) {
                console.error('No email content found');
                return;
            }

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent,
                    tone: wrapper.selectedTone // ✅ use dropdown selection
                })
            });

            if (!response.ok) throw new Error('API Request Failed');

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose box was not found');
            }
        } catch (error) {
            console.error('Auto-reply error:', error);
        } finally {
            button.textContent = 'Auto-Reply';
            button.style.pointerEvents = 'auto';
        }
    });

    toolbar.insertBefore(wrapper, toolbar.firstChild);
}
const observer = new MutationObserver((mutations)=>{
    for(const mutation of mutations){
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposedElements = addedNodes.some(node =>
            node.nodeType == Node.ELEMENT_NODE && (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if(hasComposedElements){
            console.log("composing detected");
            setTimeout(injectButton,500);
        }
    }
});

observer.observe(document.body,{
    childList:true,
    subtree:true
})