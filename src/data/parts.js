export const PARTS = [
    {
        name:'Батарея',
        desc:'Источник питания дрона.',
        facts:['3,7 В, ёмкость 1800 мАч','Время полёта 7–12 минут','Заряжается через USB'],
        quiz:{q:'Какое напряжение батареи?',opts:['5 В','3,7 В','7,4 В'],ans:1},
        color:{  h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos: new BABYLON.Vector3(1.703, 0.70, 0.25),
        targetEuler: new BABYLON.Vector3(Math.PI / 2, 0, 0),
        modelFile:'batary.glb',
        scale: 1.0
    },
    {
        name:'Батарейный отсек',
        desc:'Поддержка для платы, куда вставляется батарея.',
        facts:['Пластиковая платформа с фиксаторами','Много отверстий для винтов и вентиляции','Легко снимается для замены батареи'],
        quiz:{q:'Зачем отверстия в нижней крышке?',opts:['Для красоты','Для вентиляции','Для звука'],ans:1},
        color:{ h: 120, s: 65, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(-0.100,1.050,1.025),
        targetEuler:new BABYLON.Vector3(0,Math.PI/2,0),
        modelFile:'bat_otsek.glb',
        scale: 1.0
    },
    {
        name:'Нижняя часть корпуса',
        desc:'Центральный скелет, удерживающий все компоненты.',
        facts:['Лёгкий ударопрочный пластик','Вес всего дрона около 250 грамм','Компактный размер'],
        quiz:{q:'Из чего сделана рама?',opts:['Алюминий','Пластик','Дерево'],ans:1},
        color:{ h: 195, s: 85, l: 75 }
        , timeLimit:30,
        targetPos: new BABYLON.Vector3(1.108, 0.650, 1.581),
        targetEuler: new BABYLON.Vector3(0, Math.PI, Math.PI / 2),
        modelFile:'niz.glb',
        scale: 1.0
    },
    {
        name:'Камера',
        desc:'Камера для съёмки',
        facts:['Широкий угол обзора','Передаёт видео на смартфон','Качество среднее'],
        quiz:{q:'Куда передаёт видео камера?',opts:['На телевизор','На смартфон','На пульт'],ans:1},
        color:{ h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(0.2,0.65,1.0),
        targetEuler:new BABYLON.Vector3(Math.PI*1.5,Math.PI*1.5,0),
        modelFile:'camera.glb',
        scale: 0.91
    },
    {
        name:'Рукоятка передняя правая',
        desc:'Одна из складных "ножек" дрона.',
        facts:['Складывается вдоль корпуса для транспортировки','На конце крепится мотор и пропеллер','Имеет фиксатор угла открывания'],
        quiz:{q:'Зачем рукоятки складываются?',opts:['Для красоты','Для компактности','Чтобы летать лучше'],ans:1},
        color:{h:120, s:50, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(1.95,1.75,-1.25),
        targetEuler:new BABYLON.Vector3(0,-Math.PI/3,Math.PI/2),
        modelFile:'ruka_r.glb',
        scale: 0.74
    },
    {
        name:'Рукоятка передняя левая',
        desc:'Одна из складных "ножек" дрона',
        facts:['Зеркальная передней правой','Обеспечивает симметрию тяги','Складывается синхронно с правой'],
        quiz:{q:'Сколько рукояток у дрона E88?',opts:['2','4','6'],ans:1},
        color:{h:120, s:50, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(1.85,1.8,1.65),
        targetEuler:new BABYLON.Vector3(Math.PI,Math.PI/3,-Math.PI/2),
        modelFile:'ruka_l.glb',
        scale: 0.74
    },
    {
        name:'Рукоятка задняя правая',
        desc:'Одна из складных "ножек" дрона',
        facts:['Расположена сзади слева','Обеспечивает устойчивость при посадке','Имеет резиновые ножки для амортизации'],
        quiz:{q:'Что обеспечивают задние рукоятки?',opts:['Скорость','Устойчивость при посадке','Красоту'],ans:1},
        color:{h:120, s:50, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-0.6,0.45,-1.34),
        targetEuler:new BABYLON.Vector3(Math.PI,-Math.PI/1.33333333333333,Math.PI/2),
        modelFile:'noga_r.glb',
        scale: 0.75
    },
    {
        name:'Рукоятка задняя левая',
        desc:'Одна из складных "ножек" дрона',
        facts:['Зеркальная задней левой','Складной шарнир с фиксацией','Правое заднее опорное плечо'],
        quiz:{q:'Какая рукоятка зеркальная задней левой?',opts:['Передняя правая','Задняя правая','Передняя левая'],ans:1},
        color:{h:120, s:50, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-0.4635,0.45,1.88),
        targetEuler:new BABYLON.Vector3(Math.PI,-Math.PI/6,-Math.PI*1.5),
        modelFile:'noga_l.glb',
        scale: 0.76
    }, {
        name:'Передний левый мотор',
        desc:'Мотор на передней левой рукоятке.',
        facts:['Тип 716 coreless','Крутится против часовой стрелки','Мощность около 40 000 об/мин'],
        quiz:{q:'Какой тип моторов используется?',opts:['Бесколлекторные','Щёточные coreless','Шаговые'],ans:1},
        color:{h:50, s:80, l:50}, timeLimit:30,
        targetPos:new BABYLON.Vector3(3.9,1.82,2.85),
        targetEuler:new BABYLON.Vector3(Math.PI/2,Math.PI/0.5454,Math.PI/2),
        modelFile:'motor.glb',
        scale: 0.5
    },
    {
        name:'Передний правый мотор',
        desc:'Мотор на передней правой рукоятке.',
        facts:['Крутится по часовой стрелке','Компенсирует вращение от левого мотора'],
        quiz:{q:'Почему соседние моторы крутятся в разные стороны?',opts:['Для стабилизации','Для красоты','Случайно'],ans:0},
        color:{h:50, s:80, l:50}, timeLimit:30,
        targetPos:new BABYLON.Vector3(4,1.82,-2.45),
        targetEuler:new BABYLON.Vector3(Math.PI/2,Math.PI/4,Math.PI/2),
        modelFile:'motor.glb',
        scale: 0.5
    },
    {
        name:'Задний правый мотор',
        desc:'Мотор на задней правой рукоятке.',
        facts:['Заднее расположение — меньше нагрузки','Крутится против часовой стрелки'],
        quiz:{q:'Где расположен этот мотор?',opts:['Спереди справа','Сзади справа','Сзади слева'],ans:1},
        color:{h:50, s:80, l:50}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-2.3,0.37,-2.95),
        targetEuler:new BABYLON.Vector3(Math.PI/2,Math.PI/1.333,Math.PI/2),
        modelFile:'motor.glb',
        scale: 0.5
    },
    {
        name:'Задний левый мотор',
        desc:'Мотор на задней левой рукоятке.',
        facts:['Крутится по часовой стрелке','Компенсирует крутящий момент'],
        quiz:{q:'Сколько моторов у дрона E88?',opts:['2','4','6'],ans:1},
        color:{h:50, s:80, l:50}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-1.65,0.45,4),
        targetEuler:new BABYLON.Vector3(Math.PI/2,Math.PI/0.766,Math.PI/2),
        modelFile:'motor.glb',
        scale: 0.5
    },
    {
        name:'Верх задней левой рукоятки',
        desc:'Крепление мотора на задней левой рукоятке.',
        facts:['Пластиковая платформа с отверстиями под винты','Защищает провода от повреждений','Рассчитана на мотор 716'],
        quiz:{q:'Что крепится на верхушку рукоятки?',opts:['Камера','Мотор','Пропеллер'],ans:1},
        color:{ h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(-0.45,0.35,1.9),
        targetEuler:new BABYLON.Vector3(0,Math.PI/1.2,Math.PI/2),
        modelFile:'verh_nog.glb',
        scale: 0.76
    },
    {
        name:'Верх задней правой рукоятки',
        desc:'Крепление мотора на задней правой рукоятке.',
        facts:['Зеркальная задней левой верхушке','Винтовое соединение с мотором','Имеет направляющие для проводов'],
        quiz:{q:'Как мотор крепится к верхушке?',opts:['На клей','На винтах','На защёлках'],ans:1},
        color:{ h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(-0.6,0.3,-1.3),
        targetEuler:new BABYLON.Vector3(0,Math.PI/4,Math.PI/2),
        modelFile:'verh_nog_2.glb',
        scale: 0.76
    },
    {
        name:'Верх передней правой рукоятки',
        desc:'Крепление мотора на передней правой рукоятке.',
        facts:['Переднее расположение — больше нагрузки','Имеет виброизоляцию','Усиленная конструкция'],
        quiz:{q:'Зачем нужна виброизоляция на верхушке?',opts:['Меньше шума в видео','Красота','Лёгкость'],ans:0},
        color:{ h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(1.9,1.75,-1.2),
        targetEuler:new BABYLON.Vector3(0,-Math.PI/3,Math.PI/2),
        modelFile:'verh_nog.glb',
        scale: 0.76
    },
    {
        name:'Верх передней левой рукоятки',
        desc:'Крепление мотора на передней левой рукоятке.',
        facts:['Левое переднее крепление','Внутри проходит силовая проводка','Зеркальная передней правой'],
        quiz:{q:'Что проходит внутри рукоятки?',opts:['Провода к мотору','Вода','Воздух'],ans:0},
        color:{ h: 330, s: 80, l: 75 }
        , timeLimit:30,
        targetPos:new BABYLON.Vector3(1.8,1.7,1.65),
        targetEuler:new BABYLON.Vector3(0,Math.PI/0.75,Math.PI/2),
        modelFile:'verh_nog_2.glb',
        scale: 0.76
    },

    {
        name:'Пропеллер 1',
        desc:'Передний правый пропеллер.',
        facts:['Маркировка A','Вращается по часовой стрелке','Пластик'],
        quiz:{q:'Как маркируются пропеллеры?',opts:['Красным и синим','A и B','1 и 2'],ans:1},
        color:{h:200, s:30, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(3.55,2.25,-2.15),
        targetEuler:new BABYLON.Vector3(0,Math.PI+16.5,-Math.PI/2),
        modelFile:'prop.glb',
        scale: 1
    },
    {
        name:'Пропеллер 2',
        desc:'Передний левый пропеллер.',
        facts:['Маркировка B','Вращается против часовой стрелки','Нельзя перепутать с A'],
        quiz:{q:'Что будет, если перепутать пропеллеры A и B?',opts:['Дрон не взлетит','Будет летать быстрее','Ничего не изменится'],ans:0},
        color:{h:200, s:30, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(3.8,2.2,3.35),
        targetEuler:new BABYLON.Vector3(0,Math.PI/2.118,-Math.PI/2),
        modelFile:'prop.glb',
        scale: 1.0
    },
    {
        name:'Пропеллер 3',
        desc:'Задний правый пропеллер.',
        facts:['Гибкий пластик — не ломается при ударе','Легко меняется'],
        quiz:{q:'Из чего сделаны пропеллеры?',opts:['Дерево','Пластик','Металл'],ans:1},
        color:{h:200, s:30, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-2.35,0.82,-3.45),
        targetEuler:new BABYLON.Vector3(0,Math.PI/-2.118,-Math.PI/2),
        modelFile:'prop.glb',
        scale: 1.0
    },
    {
        name:'Пропеллер 4',
        desc:'Задний левый пропеллер.',
        facts:['Зеркальный переднему правому','В комплекте всегда есть запасной набор'],
        quiz:{q:'Что есть в комплекте к пропеллерам?',opts:['Дрон','Запасной набор','Ничего'],ans:1},
        color:{h:200, s:30, l:70}, timeLimit:30,
        targetPos:new BABYLON.Vector3(-1.75,0.85,3.55),
        targetEuler:new BABYLON.Vector3(0,Math.PI/-2.118,-Math.PI/2),
        modelFile:'prop.glb',
        scale: 1.0
    },

];
