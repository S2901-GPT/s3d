const S3D_Engine = {
    create_component(type, data = {}) {
        const root = document.getElementById('canvas-root');
        const id = 'el-' + Math.random().toString(36).substr(2, 9);
        let html = '';
        if (!data) data = {};

        switch(type) {
            case 'Hero':
                html = `<section id="${id}" class="s3d-comp py-16 px-6 text-center bg-slate-50 rounded-3xl mb-8 border border-slate-100"><h1 class="text-4xl font-black mb-4 text-slate-900 leading-tight">${data.title || 'عنوان'}</h1><p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">${data.description || 'وصف'}</p></section>`;
                break;
            case 'Define':
                html = `<div id="${id}" class="s3d-comp p-5 border-r-4 border-teal-500 bg-white shadow-sm my-5 rounded-l-xl"><span class="font-bold text-teal-700 cursor-help underline decoration-dotted" onclick="this.nextElementSibling.classList.toggle('hidden')">${data.word || 'كلمة'}</span><p class="hidden mt-3 text-slate-600 text-sm bg-teal-50 p-3 rounded-lg">${data.definition || 'تعريف'}</p></div>`;
                break;
            case 'Choice':
                const options = data.options && data.options.length > 0 ? data.options : [{label: 'خيار', result: 'نتيجة'}];
                const buttons = options.map((opt) => `<button onclick="const res = this.parentElement.nextElementSibling; res.innerText='${opt.result}'; res.classList.remove('hidden');" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700">${opt.label}</button>`).join('');
                html = `<div id="${id}" class="s3d-comp p-8 border border-slate-100 rounded-3xl bg-white my-6 shadow-sm"><h4 class="font-bold mb-5 text-slate-800 text-lg">${data.question || 'سؤال'}</h4><div class="flex gap-3 flex-wrap mb-5">${buttons}</div><div class="hidden p-4 bg-slate-50 rounded-2xl text-slate-700 italic"></div></div>`;
                break;
            case 'Card':
                const challenges = (data.challenges || []).map(c => `<div class="p-3 bg-red-50 rounded-lg border-r-4 border-red-300 mb-2"><p class="font-bold text-gray-800">${c.title}</p>${c.example ? `<p class="text-sm text-gray-600 mt-1 italic">${c.example}</p>` : ''}</div>`).join('');
                const advantages = (data.advantages || []).map(a => `<div class="p-3 bg-green-50 rounded-lg border-r-4 border-green-300 mb-2"><p class="font-bold text-gray-800">${a.title}</p>${a.example ? `<p class="text-sm text-gray-600 mt-1 italic">${a.example}</p>` : ''}</div>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white rounded-2xl shadow-sm border border-gray-100 mb-6"><div class="bg-teal-50 p-4 border-b border-teal-100"><h2 class="text-xl font-bold text-teal-800">${data.title || 'عنوان'}</h2></div><div class="p-6">${challenges ? `<h3 class="text-lg font-bold text-red-600 mb-3">⚠️ التحديات</h3>${challenges}` : ''}${advantages ? `<h3 class="text-lg font-bold text-green-600 mb-3 mt-4">⭐ المميزات</h3>${advantages}` : ''}${data.analysis ? `<div class="mt-6 p-4 bg-blue-50 rounded-xl"><h4 class="font-bold text-blue-800 mb-1">💡 التحليل:</h4><p class="text-blue-700 text-sm">${data.analysis}</p></div>` : ''}</div></div>`;
                break;
            case 'Accordion':
                const accHtml = (data.accordionItems || []).map(item => `<div class="border-b border-slate-100"><button onclick="this.nextElementSibling.classList.toggle('hidden');" class="w-full text-right py-4 font-bold text-slate-800 flex justify-between items-center"><span>${item.title}</span></button><div class="hidden pb-4 text-slate-600 text-sm leading-relaxed">${item.content}</div></div>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white rounded-2xl shadow-sm border border-slate-200 px-5 mb-6">${accHtml}</div>`;
                break;
            case 'List':
                const listTag = data.isNumbered ? 'ol' : 'ul';
                const listClass = data.isNumbered ? 'list-decimal list-inside marker:text-teal-600' : 'list-disc list-inside marker:text-teal-500';
                const liHtml = (data.listItems || []).map(item => `<li class="mb-2 text-slate-700">${item}</li>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">${data.title ? `<h3 class="font-bold text-lg mb-4">${data.title}</h3>` : ''}<${listTag} class="${listClass}">${liHtml}</${listTag}></div>`;
                break;
        }
        root.insertAdjacentHTML('beforeend', html);
        root.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    },

    update_page_html(data) {
        const root = document.getElementById('canvas-root');
        root.innerHTML = data.html;
    },

    inject_custom_html(data) {
        const root = document.getElementById('canvas-root');
        root.insertAdjacentHTML('beforeend', data.html);
        root.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }
};
