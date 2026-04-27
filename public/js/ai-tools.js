const S3D_Engine = {
    create_component(type, data) {
        const root = document.getElementById('canvas-root');
        const id = 'el-' + Math.random().toString(36).substr(2, 9);
        let html = '';

        switch(type) {
            case 'Hero':
                html = `
                <section id="${id}" class="s3d-comp py-16 px-6 text-center bg-slate-50 rounded-3xl mb-8 border border-slate-100 transition-all hover:shadow-md">
                    <h1 class="text-4xl font-black mb-4 text-slate-900 leading-tight">${data.title}</h1>
                    <p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">${data.description}</p>
                </section>`;
                break;
            case 'Define':
                html = `
                <div id="${id}" class="s3d-comp p-5 border-r-4 border-teal-500 bg-white shadow-sm my-5 rounded-l-xl">
                    <span class="font-bold text-teal-700 cursor-help underline decoration-dotted decoration-teal-300" 
                          onclick="this.nextElementSibling.classList.toggle('hidden')">
                        ${data.word} (اضغط هنا)
                    </span>
                    <p class="hidden mt-3 text-slate-600 text-sm bg-teal-50 p-3 rounded-lg border border-teal-100 animate-fade-in">
                        ${data.definition}
                    </p>
                </div>`;
                break;
            case 'Choice':
                const buttons = data.options.map((opt, i) => 
                    `<button onclick="const res = this.parentElement.nextElementSibling; res.innerText='${opt.result}'; res.classList.remove('hidden');" 
                             class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition shadow-sm active:scale-95">
                        ${opt.label}
                    </button>`).join('');
                html = `
                <div id="${id}" class="s3d-comp p-8 border border-slate-100 rounded-3xl bg-white my-6 shadow-sm">
                    <h4 class="font-bold mb-5 text-slate-800 text-lg">${data.question}</h4>
                    <div class="flex gap-3 flex-wrap mb-5">${buttons}</div>
                    <div class="hidden p-4 bg-slate-50 rounded-2xl text-slate-700 italic border border-slate-100 animate-slide-up"></div>
                </div>`;
                break;
        }
        root.insertAdjacentHTML('beforeend', html);
        root.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    }
};
