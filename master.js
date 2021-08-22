const log = console.log.bind(console);

const e = function (selectors) {
    return document.querySelector(selectors);
}

const es = function (selectors) {
    return document.querySelectorAll(selectors);
}

const database = async function () {

    const _async = new Promise(function (resolve, reject) {
        resolve('_async');
    });

    const table = {
        'bill': [],
        'category': {},
    }

    const entity = {
        'bill': function (type = 0, time = 0, category = '', amount = .0) {

            const _humane = function () {

                const _type = function () {
                    if (type == 1) {
                        return '收入';
                    } else if (type == 0) {
                        return '支出';
                    } else {
                        return '数据有误：' + type;
                    }
                }

                const _time = function () {
                    const year = time.getFullYear();
                    const month = time.getMonth() + 1;
                    const day = time.getDate();

                    return year + '/' + month + '/' + day;
                }

                const _category = function () {
                    const result = table.category[category].name;

                    if (result == null) {
                        return '数据有误：' + category;
                    }

                    return result;
                }

                return {
                    'type': _type(),
                    'time': _time(),
                    'category': _category(),
                    'amount': amount,
                }
            }

            const _sort = function () {

                const _category = function () {
                    return table.category[category].name;
                }

                return {
                    'type': type,
                    'time': time,
                    'category': _category(),
                    'amount': amount
                }
            }

            return {
                'type': type,
                'time': time,
                'category': category,
                'amount': amount,
                '_humane': _humane(),
                '_sort': _sort(),
            }
        },
        'category': function (id = '', type = 0, name = '') {

            return {
                'id': id,
                'type': type,
                'name': name,
            }
        },
    }

    const get_category = function () {
        return table.category;
    }

    const get_total = function (content) {
        let income = 0;
        let expenditure = 0;

        for (let i = 0; i < content.length; i++) {
            const row = content[i];
            const amount = parseFloat(row.amount);

            if (row.type == 0) {
                expenditure += amount;
            } else if (row.type == 1) {
                income += amount;
            }
        }

        return {
            'income': income.toFixed(2),
            'expenditure': expenditure.toFixed(2),
        }
    }

    const save_bill = function (bill) {
        table.bill.push(bill);
        localStorage['table'] = JSON.stringify(table);
    }

    const fill = async function () {

        const GET = function (url) {
            const text = fetch(url, {
                method: 'GET',
            }).then(function (res) {
                return res.text();
            });

            return text;
        }

        const get_category = async function () {
            const url = 'https://raw.githubusercontent.com/xmindltd/hiring/master/frontend-1/categories.csv';
            const handle = function (res) {
                res = res.split('\n');
                for (let i = 1; i < res.length; i++) {
                    const row = res[i].split(',');

                    const id = row[0];
                    const type = parseInt(row[1]);
                    const name = row[2];

                    table.category[id] = (entity.category(id, type, name));
                }

                log('[get_category()]', table.category);
            }

            const text = await GET(url);
            handle(text);

            return _async
        }

        const get_bill = async function () {
            const url = 'https://raw.githubusercontent.com/xmindltd/hiring/master/frontend-1/bill.csv';
            const handle = function (res) {
                res = res.split('\n');

                for (let i = 1; i < res.length; i++) {
                    const row = res[i].split(',');

                    const type = parseInt(row[0]);
                    const time = new Date(parseInt(row[1]));
                    const category = row[2];
                    const amount = parseFloat(row[3]);

                    table.bill.push(entity.bill(type, time, category, amount));
                }

                log('[get_bill()]', table.bill);
            }

            const text = await GET(url);
            handle(text);

            return _async
        }

        if (localStorage.getItem('table') == null) {
            await get_category();
            await get_bill();
        } else {
            const t = JSON.parse(localStorage.getItem('table'));
            table.bill = t.bill;

            for (let i = 0; i < table.bill.length; i++) {
                const row = table.bill[i];
                const time = new Date(row.time);
                row.time = time;
            }

            table.category = t.category;
        }

        return _async;
    }

    const sort = function (content, key, order) {

        if (order == 'asc') {
            order = -1;
        } else {
            order = 1;
        }

        const compare = function (x, y) {
            x = x['_sort'][key];
            y = y['_sort'][key];

            if (x < y) {
                return order;
            } else if (x == y) {
                return 0;
            } else {
                return -order;
            }
        }

        return content.sort(compare);
    }

    const filter = function (year, month, category) {

        const filter_year = function () {

            if (year == 'all') {
                return Array.from(table.bill);
            }

            const content = [];

            for (let i = 0; i < table.bill.length; i++) {
                const row = table.bill[i];
                const time = row.time;
                const yyyy = time.getFullYear();

                if (yyyy == year) {
                    content.push(row);
                }
            }

            return content;
        }

        const filter_month = function (content) {

            if (month == 'all') {
                return content;
            }

            const new_content = [];

            for (let i = 0; i < content.length; i++) {
                const row = content[i];
                const MM = row.time.getMonth() + 1;

                if (MM == month) {
                    new_content.push(row);
                }
            }

            return new_content;
        }

        const filter_category = function (content) {
            if (category === 'all') {
                return content;
            }

            const new_content = [];

            for (let i = 0; i < content.length; i++) {
                const row = content[i];

                if (row.category === category) {
                    new_content.push(row);
                }
            }

            return new_content;
        }

        const init = function () {
            let content = filter_year();
            content = filter_month(content);
            content = filter_category(content);

            return sort(content, 'time', 'asc');
        }

        return init();

    }

    const year_option = function () {
        const sel_year = []

        const bill = table.bill;
        for (let i = 0; i < bill.length; i++) {
            const row = bill[i];
            const year = row.time.getFullYear();

            if (sel_year.indexOf(year) < 0) {
                sel_year.push(year);
            }
        }

        return sel_year;
    }

    const init = async function () {
        await fill();

        localStorage['table'] = JSON.stringify(table);

        return _async;
    }

    await init();

    const _return = new Promise(function (resolve, reject) {
        const beau = {
            'year_option': year_option,
            'filter': filter,
            'entity': entity,
            'get_category': get_category,
            'get_total': get_total,
            'save_bill': save_bill,
        };

        resolve(beau);
    });

    return _return;
}

const env = {
    'database': {},
};

const show = function () {

    const show_all = function (year, month, category) {

        const bills = env.database.filter(year, month, category);

        const total = function () {
            const income = e('#income');
            const expenditure = e('#expenditure');

            const sum = env.database.get_total(bills);

            income.innerHTML = sum.income;
            expenditure.innerHTML = sum.expenditure;
        }

        const content = function () {
            const tbody = e('#content');

            tbody.innerHTML = "";
            for (let i = 0; i < bills.length; i++) {

                const tr = document.createElement('tr');
                for (let j = 0; j < 4; j++) {
                    tr.appendChild(document.createElement('td'));
                }

                const humane = bills[i]['_humane'];

                tr.children[0].innerHTML = humane.type;
                tr.children[1].innerHTML = humane.time;
                tr.children[2].innerHTML = humane.category;
                tr.children[3].innerHTML = humane.amount;

                tbody.appendChild(tr);
            }
        }

        const _init = function () {
            total();
            content();
        }

        _init();
    }

    const init_select = function () {

        const init_year = function () {
            const sel_year = e('#sel-year');

            const vall_option = sel_year.options[0];
            sel_year.innerHTML = '';
            sel_year.appendChild(vall_option);

            const options = env.database.year_option();
            for (let i = 0; i < options.length; i++) {
                const option = document.createElement('option');

                option.value = options[i];
                option.text = options[i] + ' 年';

                sel_year.appendChild(option);
            }
        }

        const init_month = function () {
            const sel_month = e('#sel-month');

            for (let i = 1; i <= 12; i++) {
                const option = document.createElement('option');

                option.value = i;
                option.text = i + ' 月';

                sel_month.appendChild(option);
            }
        }

        const init_category = function () {
            const sel_category = e('#sel-category');

            const category = env.database.get_category();
            for (let key in category) {
                const option = document.createElement('option');

                option.value = key;
                option.text = category[key].name;

                sel_category.appendChild(option);
            }
        }

        const _init = function () {
            init_year();
            init_month();
            init_category();
        }

        _init();
    }

    const change = function () {
        const selects = es('select');

        for (let i = 0; i < selects.length; i++) {
            selects[i].onchange = function (parameter) {

                const year = e('#sel-year').value;
                const month = e('#sel-month').value;
                const category = e('#sel-category').value;

                show_all(year, month, category, total);
            }
        }
    }

    const _init = function () {

        show_all('all', 'all', 'all');
        init_select();
        change();
    }

    _init();
}

const the_add_bill = function () {
    const _modal = function () {
        const _open = function () {
            const btn_add = e('#add');
            btn_add.onclick = function (parameter) {
                const modal = e('#modal');
                modal.style.display = 'block';
            }
        }

        const _cancel = function () {
            const btn_cancel = e('#cancel');
            btn_cancel.onclick = function () {
                const modal = e('#modal');
                modal.style.display = 'none';
            }
        }

        const _form = function () {
            const _category = function () {
                const sel_category = e('.category');
                const category = env.database.get_category();

                const _show = function () {
                    for (let key in category) {
                        const option = document.createElement('option');

                        option.value = key;
                        option.text = category[key].name;

                        sel_category.appendChild(option);
                    }
                }

                const _change = function () {
                    sel_category.onchange = function () {
                        const type = e('.type');

                        const type_id = sel_category.value;
                        const type_value = category[type_id].type;

                        let type_text = '';
                        if (type_value == 0) {
                            type_text = '- 支出 -';
                        } else if (type_value == 1) {
                            type_text = '- 收入 -';
                        }

                        type.innerHTML = type_text;
                    }
                }

                const _init = function () {
                    _show();
                    _change();
                }

                _init();
            }

            _category();
        }

        const _init = function () {
            _open();
            _cancel();
            _form();
        }

        _init();
    }

    const _save = function () {
        const _click = function () {
            const add_sel_year = function (year) {
                const sel_year = e('#sel-year');
                const options = sel_year.options;

                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    if (option.value == year) {
                        return;
                    }
                }

                const option = document.createElement('option');
                option.value = year;
                option.text = year + ' 年';

                sel_year.appendChild(option);
            }

            const save = e('#save');
            save.onclick = function () {
                const time = new Date(e('.time').value);
                const category = e('.category').value;

                let amount = e('.amount').value;
                if (amount == '') {
                    amount = 0;
                } else {
                    amount = parseFloat(amount);
                    amount = amount.toFixed(2);
                }

                const type = env.database.get_category()[category].type;

                const bill = env.database.entity.bill(type, new Date(time), category, amount);
                env.database.save_bill(bill);

                e('#sel-year').onchange();
                add_sel_year(time.getFullYear());

                e('#cancel').onclick();
                alert('保存成功！');
            }
        }
        _click();
    }

    _modal();
    _save();

}

const __main = async function () {
    env.database = await database();
    show();
    the_add_bill();
}

__main();