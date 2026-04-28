const S3D_Engine = {
    history: [],
    redoStack: [],

    saveState() {
        const root = document.getElementById('canvas-root');
        this.history.push(root.innerHTML);
        if(this.history.length > 30) this.history.shift();
        this.redoStack = [];
    },

    undo() {
        if(this.history.length === 0) return;
        const root = document.getElementById('canvas-root');
        this.redoStack.push(root.innerHTML);
        root.innerHTML = this.history.pop();
    },

    redo() {
        if(this.redoStack.length === 0) return;
        const root = document.getElementById('canvas-root');
        this.history.push(root.innerHTML);
        root.innerHTML = this.redoStack.pop();
    },

    wrapComponent(id, html) {
        return `<div id="${id}-wrap" class="relative group s3d-wrapper mb-8 transition-all duration-300"><div class="absolute -top-4 right-4 hidden group-hover:flex gap-1 bg-slate-800 text-white p-1 rounded-lg shadow-xl z-50 text-xs no-preview border border-slate-600"><button data-action="move-up" data-target="${id}-wrap" class="p-1.5 hover:bg-slate-700 rounded transition" title="نقل للأعلى">⬆️</button><button data-action="move-down" data-target="${id}-wrap" class="p-1.5 hover:bg-slate-700 rounded transition" title="نقل للأسفل">⬇️</button><button data-action="delete" data-target="${id}-wrap" class="p-1.5 hover:bg-red-600 rounded text-red-400 hover:text-white transition" title="حذف">🗑️</button></div><div id="${id}" class="s3d-inner-content">${html}</div></div>`;
    },

    create_component(type, data = {}) {
        this.saveState();
        const root = document.getElementById('canvas-root');
        const id = 'el-' + Math.random().toString(36).substr(2, 9);
        let html = '';
        if (!data) data = {};

        switch(type) {
            case 'Hero':
                html = `<section class="s3d-comp py-16 px-6 text-center bg-slate-50 rounded-3xl border border-slate-100"><h1 class="text-4xl font-black mb-4 text-slate-900">${data.title || 'عنوان'}</h1><p class="text-lg text-slate-600 max-w-2xl mx-auto">${data.description || 'وصف'}</p></section>`;
                break;
            case 'Define':
                html = `<div class="s3d-comp p-5 border-r-4 border-teal-500 bg-white shadow-sm rounded-l-xl"><span class="font-bold text-teal-700 cursor-help underline decoration-dotted" data-action="toggle-next">${data.word || 'كلمة'}</span><p class="hidden mt-3 text-slate-600 text-sm bg-teal-50 p-3 rounded-lg">${data.definition || 'تعريف'}</p></div>`;
                break;
            case 'Choice':
                const options = data.options && data.options.length > 0 ? data.options : [{label: 'خيار', result: 'نتيجة'}];
                const buttons = options.map((opt) => `<button data-action="show-choice" data-result="${opt.result}" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700">${opt.label}</button>`).join('');
                html = `<div class="s3d-comp p-8 border border-slate-100 rounded-3xl bg-white shadow-sm"><h4 class="font-bold mb-5 text-slate-800 text-lg">${data.question || 'سؤال'}</h4><div class="flex gap-3 flex-wrap mb-5">${buttons}</div><div class="hidden p-4 bg-slate-50 rounded-2xl text-slate-700 italic choice-result"></div></div>`;
                break;
            case 'Card':
                const challenges = (data.challenges || []).map(c => `<div class="p-3 bg-red-50 rounded-lg border-r-4 border-red-300 mb-2"><p class="font-bold text-gray-800">${c.title}</p>${c.example ? `<p class="text-sm text-gray-600 mt-1 italic">${c.example}</p>` : ''}</div>`).join('');
                const advantages = (data.advantages || []).map(a => `<div class="p-3 bg-green-50 rounded-lg border-r-4 border-green-300 mb-2"><p class="font-bold text-gray-800">${a.title}</p>${a.example ? `<p class="text-sm text-gray-600 mt-1 italic">${a.example}</p>` : ''}</div>`).join('');
                html = `<div class="s3d-comp bg-white rounded-2xl shadow-sm border border-gray-100"><div class="bg-teal-50 p-4 border-b border-teal-100"><h2 class="text-xl font-bold text-teal-800">${data.title || 'عنوان'}</h2></div><div class="p-6">${challenges ? `<h3 class="text-lg font-bold text-red-600 mb-3">⚠️ التحديات</h3>${challenges}` : ''}${advantages ? `<h3 class="text-lg font-bold text-green-600 mb-3 mt-4">⭐ المميزات</h3>${advantages}` : ''}${data.analysis ? `<div class="mt-6 p-4 bg-blue-50 rounded-xl"><h4 class="font-bold text-blue-800 mb-1">💡 التحليل:</h4><p class="text-blue-700 text-sm">${data.analysis}</p></div>` : ''}</div></div>`;
                break;
            case 'Accordion':
                const accHtml = (data.accordionItems || []).map(item => `<div class="border-b border-slate-100"><button data-action="toggle-next" class="w-full text-right py-4 font-bold text-slate-800 flex justify-between items-center hover:text-teal-600"><span>${item.title}</span></button><div class="hidden pb-4 text-slate-600 text-sm leading-relaxed">${item.content}</div></div>`).join('');
                html = `<div class="s3d-comp bg-white rounded-2xl shadow-sm border border-slate-200 px-5">${accHtml}</div>`;
                break;
            case 'List':
                const listTag = data.isNumbered ? 'ol' : 'ul';
                const listClass = data.isNumbered ? 'list-decimal list-inside marker:text-teal-600' : 'list-disc list-inside marker:text-teal-500';
                const liHtml = (data.listItems || []).map(item => `<li class="mb-2 text-slate-700">${item}</li>`).join('');
                html = `<div class="s3d-comp bg-white p-6 rounded-2xl shadow-sm border border-slate-100">${data.title ? `<h3 class="font-bold text-lg mb-4">${data.title}</h3>` : ''}<${listTag} class="${listClass}">${liHtml}</${listTag}></div>`;
                break;
        }
        root.insertAdjacentHTML('beforeend', this.wrapComponent(id, html));
        root.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    },

    update_style(data) {
        this.saveState();
        const root = document.getElementById('canvas-root');
        const target = data.elementId ? document.getElementById(data.elementId) : root.querySelector('.s3d-wrapper:last-child .s3d-comp');
        if (target && data.classesToAdd) data.classesToAdd.split(' ').forEach(cls => target.classList.add(cls));
        if (target && data.classesToRemove) data.classesToRemove.split(' ').forEach(cls => target.classList.remove(cls));
    }
};

document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const targetId = target.getAttribute('data-target');
    if (action === 'toggle-next') {
        target.nextElementSibling.classList.toggle('hidden');
    } else if (action === 'show-choice') {
        const resContainer = target.closest('.s3d-comp').querySelector('.choice-result');
        if (resContainer) {
            resContainer.innerText = target.getAttribute('data-result');
            resContainer.classList.remove('hidden');
        }
    } else if (action === 'move-up') {
        S3D_Engine.saveState();
        const el = document.getElementById(targetId);
        if(el && el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling);
    } else if (action === 'move-down') {
        S3D_Engine.saveState();
        const el = document.getElementById(targetId);
        if(el && el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el);
    } else if (action === 'delete') {
        S3D_Engine.saveState();
        const el = document.getElementById(targetId);
        if(el) el.remove();
    }
});
