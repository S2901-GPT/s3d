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
        return `<div id="${id}-wrap" class="relative group s3d-wrapper mb-10 transition-all duration-500 hover:z-10"><div class="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl z-50 text-sm no-preview border border-slate-700/50"><button data-action="move-up" data-target="${id}-wrap" class="px-3 py-1 hover:bg-slate-700 rounded-full transition" title="نقل للأعلى">⬆️ أعلى</button><div class="w-px h-4 bg-slate-700"></div><button data-action="move-down" data-target="${id}-wrap" class="px-3 py-1 hover:bg-slate-700 rounded-full transition" title="نقل للأسفل">⬇️ أسفل</button><div class="w-px h-4 bg-slate-700"></div><button data-action="delete" data-target="${id}-wrap" class="px-3 py-1 hover:bg-red-500 rounded-full text-red-300 hover:text-white transition" title="حذف">🗑️ حذف</button></div><div id="${id}" class="s3d-inner-content relative">${html}</div></div>`;
    },

    create_component(type, data = {}) {
        this.saveState();
        const root = document.getElementById('canvas-root');
        const id = 'el-' + Math.random().toString(36).substr(2, 9);
        let html = '';
        if (!data) data = {};

        switch(type) {
            case 'Hero':
                html = `<section class="s3d-comp py-24 px-8 text-center bg-gradient-to-b from-slate-50 to-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"><h1 class="text-5xl font-black mb-6 text-slate-900 tracking-tight leading-tight">${data.title || 'عنوان رئيسي'}</h1><p class="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">${data.description || 'وصف فاخر للمحتوى...'}</p></section>`;
                break;
            case 'Define':
                html = `<div class="s3d-comp p-6 border-r-4 border-teal-500 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl rounded-r-none"><span class="font-bold text-teal-700 text-lg cursor-pointer border-b-2 border-dotted border-teal-300 hover:text-teal-900 transition" data-action="toggle-next">${data.word || 'مصطلح'}</span><p class="hidden mt-4 text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">${data.definition || 'تعريف علمي دقيق.'}</p></div>`;
                break;
            case 'Choice':
                const options = data.options && data.options.length > 0 ? data.options : [{label: 'خيار', result: 'نتيجة'}];
                const buttons = options.map((opt) => `<button data-action="show-choice" data-result="${opt.result}" class="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-teal-500 hover:text-teal-700 hover:shadow-md transition active:scale-95">${opt.label}</button>`).join('');
                html = `<div class="s3d-comp p-10 border border-slate-100 rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><h4 class="font-black mb-6 text-slate-900 text-2xl">${data.question || 'سؤال تفاعلي'}</h4><div class="flex gap-4 flex-wrap mb-6">${buttons}</div><div class="hidden p-6 bg-teal-50/50 rounded-2xl text-slate-700 border border-teal-100/50 choice-result leading-relaxed text-lg"></div></div>`;
                break;
            case 'Card':
                const challenges = (data.challenges || []).map(c => `<div class="p-4 bg-red-50/50 rounded-2xl border border-red-100 mb-3"><p class="font-bold text-red-900">${c.title}</p>${c.example ? `<p class="text-sm text-red-700 mt-2">${c.example}</p>` : ''}</div>`).join('');
                const advantages = (data.advantages || []).map(a => `<div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-3"><p class="font-bold text-emerald-900">${a.title}</p>${a.example ? `<p class="text-sm text-emerald-700 mt-2">${a.example}</p>` : ''}</div>`).join('');
                html = `<div class="s3d-comp bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden"><div class="bg-slate-900 p-8"><h2 class="text-2xl font-black text-white">${data.title || 'تحليل شامل'}</h2></div><div class="p-8">${challenges ? `<h3 class="text-xl font-black text-red-600 mb-4 flex items-center gap-2"><span>⚠️</span> التحديات</h3>${challenges}` : ''}${advantages ? `<h3 class="text-xl font-black text-emerald-600 mb-4 mt-8 flex items-center gap-2"><span>✨</span> المميزات</h3>${advantages}` : ''}${data.analysis ? `<div class="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100"><h4 class="font-black text-blue-900 mb-2">💡 الخلاصة التحليلية:</h4><p class="text-blue-800 leading-relaxed">${data.analysis}</p></div>` : ''}</div></div>`;
                break;
            case 'Accordion':
                const accHtml = (data.accordionItems || []).map(item => `<div class="border-b border-slate-100 last:border-0"><button data-action="toggle-next" class="w-full text-right py-6 font-bold text-slate-800 text-lg flex justify-between items-center hover:text-teal-600 transition group"><span>${item.title}</span><span class="text-slate-300 group-hover:text-teal-500 text-2xl font-light">+</span></button><div class="hidden pb-6 text-slate-500 leading-relaxed">${item.content}</div></div>`).join('');
                html = `<div class="s3d-comp bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 px-8 py-2">${accHtml}</div>`;
                break;
            case 'List':
                const listTag = data.isNumbered ? 'ol' : 'ul';
                const listClass = data.isNumbered ? 'list-decimal list-inside marker:text-teal-600 marker:font-black space-y-3' : 'list-disc list-inside marker:text-teal-500 space-y-3';
                const liHtml = (data.listItems || []).map(item => `<li class="text-slate-700 leading-relaxed text-lg">${item}</li>`).join('');
                html = `<div class="s3d-comp bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">${data.title ? `<h3 class="font-black text-2xl mb-6 text-slate-900">${data.title}</h3>` : ''}<${listTag} class="${listClass}">${liHtml}</${listTag}></div>`;
                break;
        }
        root.insertAdjacentHTML('beforeend', this.wrapComponent(id, html));
        root.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    },

    update_page_html(data) {
        this.saveState();
        document.getElementById('canvas-root').innerHTML = data.html;
    },

    inject_custom_html(data) {
        this.saveState();
        const root = document.getElementById('canvas-root');
        root.insertAdjacentHTML('beforeend', this.wrapComponent('custom-' + Math.random().toString(36).substr(2, 6), data.html));
        root.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
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
