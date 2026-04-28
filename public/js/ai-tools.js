const S3D_Engine = {
    create_component(type, data = {}) {
        const root = document.getElementById('canvas-root');
        const id = 'el-' + Math.random().toString(36).substr(2, 9);
        let html = '';

        if (!data) data = {};

        switch(type) {
            case 'Hero':
                const title = data.title || 'عنوان القسم';
                const desc = data.description || 'وصف تفصيلي للقسم هنا...';
                html = `<section id="${id}" class="s3d-comp py-16 px-6 text-center bg-slate-50 rounded-3xl mb-8 border border-slate-100 transition-all hover:shadow-md"><h1 class="text-4xl font-black mb-4 text-slate-900 leading-tight">${title}</h1><p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">${desc}</p></section>`;
                break;
            case 'Define':
                const word = data.word || 'كلمة غير محددة';
                const def = data.definition || 'لم يتم توفير تعريف.';
                html = `<div id="${id}" class="s3d-comp p-5 border-r-4 border-teal-500 bg-white shadow-sm my-5 rounded-l-xl"><span class="font-bold text-teal-700 cursor-help underline decoration-dotted decoration-teal-300" onclick="this.nextElementSibling.classList.toggle('hidden')">${word} (اضغط هنا)</span><p class="hidden mt-3 text-slate-600 text-sm bg-teal-50 p-3 rounded-lg border border-teal-100 animate-fade-in">${def}</p></div>`;
                break;
            case 'Choice':
                const question = data.question || 'اختر إحدى الإجابات:';
                const options = data.options && data.options.length > 0 ? data.options : [{label: 'خيار أ', result: 'نتيجة أ'}];
                const buttons = options.map((opt) => `<button onclick="const res = this.parentElement.nextElementSibling; res.innerText='${opt.result}'; res.classList.remove('hidden');" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition shadow-sm active:scale-95">${opt.label}</button>`).join('');
                html = `<div id="${id}" class="s3d-comp p-8 border border-slate-100 rounded-3xl bg-white my-6 shadow-sm"><h4 class="font-bold mb-5 text-slate-800 text-lg">${question}</h4><div class="flex gap-3 flex-wrap mb-5">${buttons}</div><div class="hidden p-4 bg-slate-50 rounded-2xl text-slate-700 italic border border-slate-100 animate-slide-up"></div></div>`;
                break;
            case 'Card':
                const cardTitle = data.title || 'عنوان البطاقة';
                const challenges = data.challenges || [];
                const advantages = data.advantages || [];
                const analysis = data.analysis || '';
                const challengesHtml = challenges.map(c => `<div class="p-3 bg-red-50 rounded-lg border-r-4 border-red-300 mb-2"><p class="font-bold text-gray-800">${c.title}</p>${c.example ? `<p class="text-sm text-gray-600 mt-1 italic">مثال: ${c.example}</p>` : ''}</div>`).join('');
                const advantagesHtml = advantages.map(a => `<div class="p-3 bg-green-50 rounded-lg border-r-4 border-green-300 mb-2"><p class="font-bold text-gray-800">${a.title}</p>${a.example ? `<p class="text-sm text-gray-600 mt-1 italic">مثال: ${a.example}</p>` : ''}</div>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 hover:shadow-md transition"><div class="bg-teal-50 p-4 border-b border-teal-100"><h2 class="text-xl font-bold text-teal-800">${cardTitle}</h2></div><div class="p-6">${challenges.length > 0 ? `<h3 class="text-lg font-bold text-red-600 mb-3">⚠️ التحديات</h3>${challengesHtml}` : ''}${advantages.length > 0 ? `<h3 class="text-lg font-bold text-green-600 mb-3 mt-4">⭐ المميزات</h3>${advantagesHtml}` : ''}${analysis ? `<div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"><h4 class="font-bold text-blue-800 mb-1">💡 التحليل:</h4><p class="text-blue-700 text-sm">${analysis}</p></div>` : ''}</div></div>`;
                break;
            case 'Accordion':
                const accItems = data.accordionItems || [];
                const accHtml = accItems.map(item => `<div class="border-b border-slate-100 last:border-0"><button onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('svg').classList.toggle('rotate-180')" class="w-full text-right py-4 font-bold text-slate-800 flex justify-between items-center hover:text-teal-600 transition"><span>${item.title}</span><svg class="w-5 h-5 text-slate-400 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button><div class="hidden pb-4 text-slate-600 leading-relaxed text-sm animate-fade-in">${item.content}</div></div>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white rounded-2xl shadow-sm border border-slate-200 px-5 mb-6">${accHtml}</div>`;
                break;
            case 'List':
                const listTitle = data.title || '';
                const listItems = data.listItems || [];
                const isNumbered = data.isNumbered || false;
                const listTag = isNumbered ? 'ol' : 'ul';
                const listClass = isNumbered ? 'list-decimal list-inside marker:text-teal-600 marker:font-bold' : 'list-disc list-inside marker:text-teal-500';
                const liHtml = listItems.map(item => `<li class="mb-2 text-slate-700 leading-relaxed pl-2">${item}</li>`).join('');
                html = `<div id="${id}" class="s3d-comp bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">${listTitle ? `<h3 class="font-bold text-lg text-slate-800 mb-4 border-b pb-2">${listTitle}</h3>` : ''}<${listTag} class="${listClass} space-y-1">${liHtml}</${listTag}></div>`;
                break;
        }
        root.insertAdjacentHTML('beforeend', html);
        root.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    }
};
