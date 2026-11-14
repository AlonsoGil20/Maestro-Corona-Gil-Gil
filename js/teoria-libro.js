/* Libro de teoría musical de Maestro Corona Gil&Gil (texto original, pensado para el acordeón diatónico).
   Orden de capítulos inspirado en el temario habitual: lectura, intervalos, escalas, acordes, funciones
   armónicas y formas; más un capítulo propio sobre el acordeón.

   Bloques de cada lección:
   - texto HTML (string)
   - { ej: 'Do4 Re4 Mi4', label }      ejemplo que suena, se escribe en el pentagrama y se ilumina en el
                                        acordeón; los acordes se juntan con «+» (Do4+Mi4+Sol4)
   - { ir: {...}, texto }               botón que abre otra parte de la app ya preparada
   - { q, opts, a, why }                pregunta para comprobar lo aprendido (a = índice de la correcta) */
const LIBRO = [
  {
    titulo: 'Lectura musical',
    lecciones: [
      {
        titulo: 'Las notas y el pentagrama',
        bloques: [
          'La música occidental usa <b>siete nombres de nota</b>: <b>Do, Re, Mi, Fa, Sol, La, Si</b>. Después del Si vuelve el Do, más agudo, y la serie se repite. En inglés se usan letras: C, D, E, F, G, A, B (puedes cambiarlo arriba en «Notación»).',
          'Las notas se escriben en el <b>pentagrama</b>: cinco líneas y cuatro espacios. Cuanto más arriba está la nota, más aguda suena. Cuando una nota no cabe, se agregan pequeñas <b>líneas adicionales</b> arriba o abajo.',
          { ej: 'Do4 Re4 Mi4 Fa4 Sol4 La4 Si4 Do5', label: 'Las siete notas y el Do siguiente' },
          'La <b>clave</b>, al principio del pentagrama, dice qué nota va en cada línea. La <b>clave de sol</b> 𝄞 marca el Sol en la segunda línea y se usa para los sonidos medios y agudos: es la de los <b>pitos</b> (mano derecha). La <b>clave de fa</b> 𝄢 marca el Fa en la cuarta línea y se usa para los graves: es la de los <b>bajos</b> (mano izquierda).',
          { ej: 'Sol2 La2 Si2 Do3 Re3 Mi3 Fa3', label: 'Notas graves en clave de fa' },
          { q: '¿Qué clave se usa para escribir la música de los pitos?', opts: ['Clave de sol', 'Clave de fa', 'No usan clave'], a: 0, why: 'Los pitos suenan en el registro medio y agudo, que se escribe en clave de sol.' },
        ],
      },
      {
        titulo: 'Octavas y registro',
        bloques: [
          'De un Do al siguiente Do hay una <b>octava</b>. Las dos notas se llaman igual porque suenan «parecidas»: la de arriba vibra exactamente el doble de rápido.',
          'Para saber de qué Do hablamos se agrega un número: <b>Do4 es el Do central</b> (el del medio del piano). Do3 está una octava más grave y Do5 una más aguda. La app usa esta forma en todas partes: «Sol4», «Mi5»…',
          { ej: 'Do3 Do4 Do5 Do6', label: 'Cuatro Do en cuatro octavas' },
          'El acordeón Tres Coronas en Sol-Do-Fa va, en los pitos, desde el <b>Sol3</b> hasta el <b>La6</b>, y los bajos suenan una o dos octavas más abajo. Por eso en «Escalas» puedes elegir «Todo el acordeón (graves y agudos)».',
          { ir: { tab: 'scales', set: [['#sType', 'mayor'], ['#sRoot', '0'], ['#sInt', 'simple'], ['#sSpan', 'todo']] }, texto: 'Ver Do mayor por todo el acordeón' },
          { q: '¿Cuál de estas notas es más aguda?', opts: ['Sol3', 'Do4', 'Re5'], a: 2, why: 'El número de octava manda: Re5 está en la quinta octava, por encima de las otras.' },
        ],
      },
      {
        titulo: 'Alteraciones',
        bloques: [
          'Entre algunas notas hay una nota intermedia. Para nombrarla se usan las <b>alteraciones</b>: el <b>sostenido ♯</b> sube medio tono (Do♯ está entre Do y Re) y el <b>bemol ♭</b> baja medio tono (Re♭ también está entre Do y Re). El <b>becuadro ♮</b> anula la alteración.',
          { ej: 'Do4 Do#4 Re4 Re#4 Mi4', label: 'Do, Do♯, Re, Re♯, Mi' },
          'Do♯ y Re♭ suenan igual: son <b>enarmónicas</b>. Se escribe una u otra según la escala o el acorde. Entre <b>Mi y Fa</b> y entre <b>Si y Do</b> no hay nota intermedia: ya están a medio tono.',
          'En el acordeón diatónico, <b>el primer pito de cada hilera</b> (el de arriba) es el de las alteraciones: en Sol-Do-Fa da Do♯, Fa♯ y Mi♭ cerrando, y Mi♭, Sol♯ y Do♯ abriendo.',
          { ej: 'Do#4 Fa#4 Mib5', label: 'Los primeros pitos cerrando (Sol-Do-Fa)' },
          { q: '¿Qué nota suena igual que Sol♯?', opts: ['La♭', 'Sol♭', 'La♯'], a: 0, why: 'Sol♯ sube medio tono desde Sol y La♭ baja medio tono desde La: es la misma tecla.' },
        ],
      },
      {
        titulo: 'Figuras y silencios',
        bloques: [
          'La duración de cada nota se escribe con una <b>figura</b>. Tomando la negra como un pulso: <b>redonda</b> = 4 pulsos, <b>blanca</b> = 2, <b>negra</b> = 1, <b>corchea</b> = ½ y <b>semicorchea</b> = ¼. Cada figura dura la mitad que la anterior.',
          'Cada figura tiene su <b>silencio</b>, que dura lo mismo pero sin sonar. El <b>puntillo</b> después de una figura le suma la mitad de su valor: una negra con puntillo dura 1½ pulsos. El <b>tresillo</b> mete tres notas donde normalmente caben dos.',
          { ir: { tab: 'solfeo', mode: 'ritmo', set: [['#rLesson', 'corcheas']] }, texto: 'Practicar figuras en Solfeo → Ritmo' },
          { q: '¿Cuántas corcheas caben en una blanca?', opts: ['2', '4', '8'], a: 1, why: 'Una blanca vale 2 pulsos y cada corchea medio pulso: 2 ÷ ½ = 4.' },
        ],
      },
      {
        titulo: 'El compás',
        bloques: [
          'La música se agrupa en <b>compases</b>, separados por barras verticales. Los dos números del principio dicen cuántos pulsos tiene cada compás (arriba) y qué figura vale un pulso (abajo).',
          '<b>2/4</b>: dos negras por compás (marcha, <b>paseo</b> y <b>puya</b> vallenatos). <b>3/4</b>: tres negras (vals). <b>4/4</b>: cuatro negras, el más común. <b>6/8</b>: seis corcheas en dos grupos de tres; se siente en dos pulsos «balanceados», como el <b>merengue</b> vallenato.',
          'El primer pulso de cada compás es el más fuerte. En el acordeón, el bajo suele caer en ese pulso fuerte y el acorde de los bajos en los débiles.',
          { ir: { tab: 'solfeo', mode: 'ritmo', set: [['#rLesson', 'merengue']] }, texto: 'Escuchar el merengue en 6/8' },
          { q: 'En un compás de 6/8, ¿cuántas corcheas hay?', opts: ['3', '6', '8'], a: 1, why: 'El número de arriba (6) dice cuántas figuras caben, y el de abajo (8) que la figura es la corchea.' },
        ],
      },
      {
        titulo: 'Ligaduras y puntillos',
        bloques: [
          'La <b>ligadura de prolongación</b> es una curva que une dos notas <b>iguales</b>: se toca solo la primera y se mantiene sonando la suma de las dos. Sirve para que una nota cruce la barra de compás. Una blanca ligada a una negra dura 3 pulsos.',
          'La <b>ligadura de expresión</b> une notas <b>distintas</b> e indica tocarlas unidas, sin cortar el sonido (<i>legato</i>). En el acordeón se logra sin cambiar el fuelle entre esas notas.',
          'El <b>puntillo</b> suma la mitad del valor: negra con puntillo = 1 + ½ = 1½ pulsos; blanca con puntillo = 2 + 1 = 3 pulsos. Es lo mismo que ligar la figura con otra de la mitad de su valor.',
          { q: 'Una blanca ligada a una corchea dura…', opts: ['2 pulsos', '2½ pulsos', '3 pulsos'], a: 1, why: 'Blanca (2) + corchea (½) = 2½ pulsos, y solo se toca una vez.' },
          { q: '¿Cuánto dura una negra con puntillo?', opts: ['1 pulso', '1½ pulsos', '2 pulsos'], a: 1, why: 'El puntillo suma la mitad de la negra: 1 + ½.' },
        ],
      },
      {
        titulo: 'Signos de repetición',
        bloques: [
          'Para no escribir dos veces lo mismo se usan <b>signos de repetición</b>. Las <b>barras de repetición</b> (dos puntos junto a una doble barra) indican volver al comienzo de esa sección y tocarla otra vez.',
          'Las <b>casillas 1ª y 2ª</b> indican finales distintos: la primera vez se toca la casilla 1 y se repite; la segunda vez se salta a la casilla 2.',
          '<b>D.C.</b> (<i>Da Capo</i>) significa «volver al principio». <b>D.S.</b> (<i>Dal Segno</i>) significa «volver al signo 𝄋». <b>Fine</b> marca dónde termina la obra al repetir, y <b>Coda</b> 𝄌 es una sección final a la que se salta cuando se indica. «D.C. al Fine» = volver al principio y terminar en Fine.',
          { q: '¿Qué indica «D.C. al Fine»?', opts: ['Volver al signo y terminar en la coda', 'Volver al principio y terminar donde dice Fine', 'Repetir solo el último compás'], a: 1, why: 'D.C. es «desde el principio» y Fine es el final.' },
        ],
      },
      {
        titulo: 'Matices, tempo y articulación',
        bloques: [
          'Los <b>matices</b> indican el volumen: <b>pp</b> pianísimo, <b>p</b> piano (suave), <b>mp</b> mezzopiano, <b>mf</b> mezzoforte, <b>f</b> forte (fuerte), <b>ff</b> fortísimo. <b>Crescendo</b> (<) es ir subiendo el volumen y <b>diminuendo</b> (>) ir bajándolo. En el acordeón el volumen depende de la fuerza con que se mueve el fuelle.',
          'El <b>tempo</b> es la velocidad. De lento a rápido: <b>Largo</b>, <b>Adagio</b>, <b>Andante</b> (al paso), <b>Moderato</b>, <b>Allegro</b> (rápido), <b>Presto</b> (muy rápido). También se indica con el metrónomo: ♩ = 100 son 100 negras por minuto. <i>Ritardando</i> = ir frenando; <i>a tempo</i> = volver a la velocidad.',
          'La <b>articulación</b> dice cómo atacar cada nota: <b>staccato</b> (punto: corta y separada), <b>legato</b> (unida), <b>acento</b> (>: más fuerte) y <b>calderón</b> 𝄐 (sostener la nota más de lo escrito).',
          { q: '¿Qué matiz es más fuerte?', opts: ['mp', 'mf', 'p'], a: 1, why: 'Mezzoforte (mf) es medio fuerte; mp y p son suaves.' },
          { q: 'Ordena de lento a rápido: ¿cuál va primero?', opts: ['Allegro', 'Andante', 'Adagio'], a: 2, why: 'Adagio es lento, Andante es al paso y Allegro es rápido.' },
        ],
      },
      {
        titulo: 'Repaso del capítulo',
        bloques: [
          'Comprueba lo aprendido en este capítulo. Si fallas una pregunta, vuelve a leer la lección correspondiente.',
          { q: '¿Cuántas líneas tiene el pentagrama?', opts: ['4', '5', '6'], a: 1, why: 'Cinco líneas y cuatro espacios.' },
          { q: '¿Qué figura dura dos pulsos de negra?', opts: ['Redonda', 'Blanca', 'Corchea'], a: 1, why: 'La blanca vale 2 negras.' },
          { q: '¿Qué alteración baja medio tono?', opts: ['Sostenido', 'Bemol', 'Becuadro'], a: 1, why: 'El bemol baja; el sostenido sube; el becuadro anula.' },
          { q: 'En 3/4, ¿cuántos pulsos tiene cada compás?', opts: ['2', '3', '4'], a: 1, why: 'El número de arriba indica tres pulsos de negra.' },
          { q: '¿Qué significa un punto sobre la nota (staccato)?', opts: ['Tocarla corta', 'Tocarla más fuerte', 'Sostenerla'], a: 0, why: 'El staccato separa y acorta la nota.' },
        ],
      },
    ],
  },
  {
    titulo: 'Intervalos',
    lecciones: [
      {
        titulo: 'Tono y semitono',
        bloques: [
          'Un <b>intervalo</b> es la distancia entre dos notas. La distancia más pequeña de nuestra música es el <b>semitono</b> (medio tono): por ejemplo Mi–Fa o Do–Do♯. Dos semitonos forman un <b>tono</b>: Do–Re, Fa–Sol.',
          { ej: 'Mi4 Fa4', label: 'Semitono: Mi–Fa' },
          { ej: 'Do4 Re4', label: 'Tono: Do–Re' },
          'Si las notas suenan una después de otra, el intervalo es <b>melódico</b>; si suenan juntas, es <b>armónico</b>. En el acordeón vallenato los intervalos armónicos (dos pitos a la vez) son la base de los adornos.',
          { q: '¿Entre qué notas naturales hay solo un semitono?', opts: ['Do–Re y Fa–Sol', 'Mi–Fa y Si–Do', 'Sol–La y La–Si'], a: 1, why: 'Son las únicas parejas de notas naturales sin una nota intermedia.' },
        ],
      },
      {
        titulo: 'Nombre y número del intervalo',
        bloques: [
          'El <b>número</b> del intervalo se obtiene contando los nombres de nota, incluyendo la primera y la última. De Do a Mi: Do (1), Re (2), Mi (3) → una <b>tercera</b>. De Do a La: seis nombres → una <b>sexta</b>. De Do al Do siguiente → una <b>octava</b>.',
          { ej: 'Do4+Mi4 Do4+La4 Do4+Do5', label: 'Tercera, sexta y octava sobre Do' },
          'Las alteraciones no cambian el número: Do–Mi♭ y Do–Mi son las dos terceras, porque los nombres son Do y Mi. Lo que cambia es la <b>calidad</b>, que vemos en la lección siguiente.',
          { q: '¿Qué número tiene el intervalo Re–La?', opts: ['Cuarta', 'Quinta', 'Sexta'], a: 1, why: 'Re, Mi, Fa, Sol, La: cinco nombres, una quinta.' },
        ],
      },
      {
        titulo: 'Calidad: mayor, menor y justa',
        bloques: [
          'Dos terceras pueden tener distinto tamaño. Contando semitonos: la <b>tercera mayor</b> tiene 4 (Do–Mi) y la <b>tercera menor</b> 3 (Do–Mi♭). La mayor suena luminosa y la menor más triste.',
          { ej: 'Do4+Mi4 Do4+Mib4', label: 'Tercera mayor y tercera menor' },
          '<b>Tabla de intervalos</b> (en semitonos): 2ª menor 1 · 2ª mayor 2 · 3ª menor 3 · 3ª mayor 4 · 4ª justa 5 · tritono 6 · 5ª justa 7 · 6ª menor 8 · 6ª mayor 9 · 7ª menor 10 · 7ª mayor 11 · 8ª justa 12.',
          'Las cuartas, quintas y octavas se llaman <b>justas</b> porque tienen un solo tamaño «normal». Si se agranda un semitono es <b>aumentado</b> y si se achica, <b>disminuido</b>. El <b>tritono</b> (6 semitonos) es la cuarta aumentada o quinta disminuida: es el sonido de tensión de los acordes de séptima.',
          { ir: { tab: 'solfeo', mode: 'oido', set: [['#oType', 'intervalos']] }, texto: 'Entrenar el oído con intervalos' },
          { q: '¿Cuántos semitonos tiene una sexta mayor?', opts: ['8', '9', '10'], a: 1, why: 'La sexta mayor tiene 9 semitonos (Do–La); la menor, 8 (Do–La♭).' },
        ],
      },
      {
        titulo: 'Terceras, sextas y décimas',
        bloques: [
          'Los intervalos más grandes que la octava son <b>compuestos</b>. La <b>décima</b> es una tercera más una octava: Do4–Mi5. Suena como una tercera, pero más abierta.',
          { ej: 'Do4+Mi4 Do4+Mi5', label: 'Tercera y décima' },
          'Tocar una melodía en <b>terceras</b>, <b>sextas</b> o <b>décimas</b> es el adorno más típico del acordeón vallenato: la melodía va acompañada de una segunda voz a esa distancia. En la pestaña Escalas puedes tocar cualquier escala así.',
          { ej: 'Do4+Mi4 Re4+Fa4 Mi4+Sol4 Fa4+La4 Sol4+Si4', label: 'Escala de Do en terceras' },
          { ir: { tab: 'scales', set: [['#sType', 'mayor'], ['#sRoot', '0'], ['#sInt', 'terceras'], ['#sSpan', '1']] }, texto: 'Ver Do mayor en terceras' },
          { q: 'Una décima es igual a…', opts: ['Una tercera más una octava', 'Una quinta más una quinta', 'Una sexta más una cuarta'], a: 0, why: '3 + 8 − 1 = 10: al juntar intervalos se resta 1 porque la nota del medio se cuenta dos veces.' },
        ],
      },
      {
        titulo: 'Inversión de intervalos',
        bloques: [
          '<b>Invertir</b> un intervalo es pasar la nota de abajo una octava arriba. Do–Mi (tercera) invertido es Mi–Do (sexta). Los números de un intervalo y su inversión <b>siempre suman 9</b>: 3ª ↔ 6ª, 2ª ↔ 7ª, 4ª ↔ 5ª.',
          { ej: 'Do4+Mi4 Mi4+Do5', label: 'Tercera Do–Mi y su inversión: sexta Mi–Do' },
          'Además, lo mayor se vuelve menor y lo menor se vuelve mayor (lo justo sigue justo). Por eso <b>tocar en sextas</b> se siente tan parecido a tocar en terceras: son las mismas notas con la segunda voz cambiada de octava.',
          { q: '¿Qué intervalo es la inversión de una tercera menor?', opts: ['Sexta mayor', 'Sexta menor', 'Tercera mayor'], a: 0, why: '3 ↔ 6 y menor ↔ mayor: una sexta mayor.' },
        ],
      },
      {
        titulo: 'Repaso del capítulo',
        bloques: [
          'Comprueba lo aprendido sobre intervalos. Escucha cada ejemplo antes de responder.',
          { ej: 'Re4+Fa#4', label: 'Escucha: Re–Fa♯' },
          { q: '¿Qué intervalo es Re–Fa♯?', opts: ['Tercera menor', 'Tercera mayor', 'Cuarta justa'], a: 1, why: 'Re–Fa♯ son 4 semitonos: tercera mayor.' },
          { q: '¿Cuántos semitonos tiene una quinta justa?', opts: ['5', '7', '8'], a: 1, why: 'Do–Sol: 7 semitonos.' },
          { q: 'La inversión de una cuarta es…', opts: ['Una quinta', 'Una sexta', 'Una tercera'], a: 0, why: '4 + 5 = 9.' },
          { q: '¿Qué es una décima?', opts: ['Una tercera compuesta', 'Una quinta compuesta', 'Dos octavas'], a: 0, why: 'Una tercera más una octava.' },
        ],
      },
    ],
  },
  {
    titulo: 'Escalas',
    lecciones: [
      {
        titulo: 'La escala mayor',
        bloques: [
          'Una <b>escala</b> es una serie de notas ordenadas de grave a agudo. La <b>escala mayor</b> sigue siempre el mismo patrón de tonos (T) y semitonos (S): <b>T T S T T T S</b>.',
          { ej: 'Do4 Re4 Mi4 Fa4 Sol4 La4 Si4 Do5', label: 'Do mayor: sin alteraciones' },
          'Empezando en otra nota hay que poner alteraciones para respetar el patrón. Sol mayor necesita Fa♯; Fa mayor necesita Si♭. Esas tres son justamente las escalas de las tres hileras del acordeón Sol-Do-Fa.',
          { ej: 'Sol4 La4 Si4 Do5 Re5 Mi5 Fa#5 Sol5', label: 'Sol mayor: un sostenido (Fa♯)' },
          { ir: { tab: 'scales', set: [['#sType', 'mayor'], ['#sRoot', '7'], ['#sInt', 'simple'], ['#sSpan', '1']] }, texto: 'Ver Sol mayor en el acordeón' },
          { q: '¿Qué patrón tiene la escala mayor?', opts: ['T T S T T T S', 'T S T T S T T', 'T T T S T T S'], a: 0, why: 'Dos tonos, un semitono, tres tonos y un semitono.' },
        ],
      },
      {
        titulo: 'Las escalas menores',
        bloques: [
          'La <b>menor natural</b> tiene el patrón <b>T S T T S T T</b>. Suena más oscura porque su tercera es menor.',
          { ej: 'La4 Si4 Do5 Re5 Mi5 Fa5 Sol5 La5', label: 'La menor natural' },
          'La <b>menor armónica</b> sube la séptima nota medio tono (Sol♯ en La menor). Así aparece una «nota sensible» que pide resolver a la tónica, y el acorde del quinto grado se vuelve mayor (Mi mayor, Mi7).',
          { ej: 'La4 Si4 Do5 Re5 Mi5 Fa5 Sol#5 La5', label: 'La menor armónica' },
          'La <b>menor melódica</b> sube la sexta y la séptima al subir (Fa♯, Sol♯) para que la melodía fluya, y al bajar vuelve a la natural.',
          { ej: 'La4 Si4 Do5 Re5 Mi5 Fa#5 Sol#5 La5', label: 'La menor melódica (subiendo)' },
          { ir: { tab: 'scales', set: [['#sType', 'armonica'], ['#sRoot', '9'], ['#sInt', 'simple'], ['#sSpan', '1']] }, texto: 'Ver La menor armónica en el acordeón' },
          { q: '¿Qué nota cambia la menor armónica respecto de la natural?', opts: ['La tercera', 'La quinta', 'La séptima'], a: 2, why: 'Sube la séptima medio tono para tener nota sensible.' },
        ],
      },
      {
        titulo: 'Tonalidades relativas',
        bloques: [
          'Cada escala mayor comparte sus notas con una menor que empieza en su <b>sexto grado</b>: es su <b>relativa menor</b>. Do mayor y La menor tienen las mismas notas, sin alteraciones; Sol mayor y Mi menor comparten el Fa♯.',
          { ej: 'Do4 Mi4 Sol4 La4+Do5+Mi5', label: 'Do mayor y su relativa La menor' },
          'Por eso, con los mismos botones de una hilera, se puede tocar en la tonalidad mayor y en su relativa menor. En el círculo «armónico» I–vi–ii–V7 aparece justamente la relativa (vi).',
          { q: '¿Cuál es la relativa menor de Fa mayor?', opts: ['Re menor', 'La menor', 'Mi menor'], a: 0, why: 'El sexto grado de Fa mayor es Re: Fa, Sol, La, Si♭, Do, Re.' },
        ],
      },
      {
        titulo: 'Armaduras y círculo de quintas',
        bloques: [
          'En vez de escribir las alteraciones en cada nota, se ponen al principio del pentagrama, junto a la clave: es la <b>armadura</b>. Vale para toda la obra y dice en qué tonalidad estamos.',
          'Los sostenidos aparecen siempre en este orden: <b>Fa, Do, Sol, Re, La, Mi, Si</b>. Los bemoles, al revés: <b>Si, Mi, La, Re, Sol, Do, Fa</b>.',
          'Truco para reconocer la tonalidad: con sostenidos, la tónica mayor está <b>medio tono arriba del último sostenido</b> (Fa♯ y Do♯ → Re mayor). Con bemoles, la tónica es el <b>penúltimo bemol</b> (Si♭ y Mi♭ → Si♭ mayor); con un solo bemol es Fa mayor.',
          'El <b>círculo de quintas</b> ordena las tonalidades: subiendo de quinta en quinta se agrega un sostenido (Do 0, Sol 1, Re 2, La 3, Mi 4, Si 5…) y bajando de quinta en quinta se agrega un bemol (Fa 1, Si♭ 2, Mi♭ 3, La♭ 4…). Las hileras del Sol-Do-Fa son tres tonalidades vecinas en ese círculo.',
          { ej: 'Fa3 Do4 Sol4 Re5', label: 'Subiendo por quintas: Fa – Do – Sol – Re' },
          { q: '¿Qué tonalidad mayor tiene dos sostenidos (Fa♯ y Do♯)?', opts: ['Sol mayor', 'Re mayor', 'La mayor'], a: 1, why: 'Medio tono arriba del último sostenido (Do♯) está Re.' },
          { q: '¿Cuántos bemoles tiene Fa mayor?', opts: ['Ninguno', 'Uno (Si♭)', 'Dos'], a: 1, why: 'Fa mayor necesita Si♭ para cumplir el patrón T T S T T T S.' },
        ],
      },
      {
        titulo: 'Pentatónicas y mixolidia',
        bloques: [
          'La <b>pentatónica mayor</b> usa solo cinco notas de la escala mayor: 1, 2, 3, 5 y 6 (Do, Re, Mi, Sol, La). Al no tener semitonos, casi cualquier combinación suena bien: es ideal para improvisar.',
          { ej: 'Do4 Re4 Mi4 Sol4 La4 Do5', label: 'Pentatónica mayor de Do' },
          'La <b>pentatónica menor</b> usa 1, ♭3, 4, 5 y ♭7 (La, Do, Re, Mi, Sol). La <b>mixolidia</b> es una escala mayor con la séptima baja (Sol mayor con Fa natural); tiene sabor a acorde de séptima y aparece mucho en la música popular.',
          { ej: 'Sol4 La4 Si4 Do5 Re5 Mi5 Fa5 Sol5', label: 'Sol mixolidia' },
          { q: '¿Cuántas notas tiene una escala pentatónica?', opts: ['5', '6', '7'], a: 0, why: '«Penta» significa cinco.' },
        ],
      },
      {
        titulo: 'Escalas especiales',
        bloques: [
          'La <b>escala cromática</b> recorre los doce semitonos seguidos. Sirve para pasar de una nota a otra «arrastrando» y para dominar todo el teclado. Se suele escribir con sostenidos al subir y bemoles al bajar.',
          { ej: 'Do4 Do#4 Re4 Re#4 Mi4 Fa4 Fa#4 Sol4', label: 'Cromática desde Do' },
          'La escala de <b>tonos enteros</b> (hexátona) tiene seis notas, todas a un tono: Do, Re, Mi, Fa♯, Sol♯, La♯. <b>No es la escala mayor</b>: no tiene semitonos, y por eso suena flotante, sin un centro claro. Solo existen dos: la que empieza en Do y la que empieza en Do♯.',
          { ej: 'Do4 Re4 Mi4 Fa#4 Sol#4 La#4 Do5', label: 'Tonos enteros desde Do' },
          { q: '¿Cuántas notas distintas tiene la escala cromática?', opts: ['7', '10', '12'], a: 2, why: 'Todos los semitonos de la octava: doce.' },
        ],
      },
      {
        titulo: 'Repaso del capítulo',
        bloques: [
          'Comprueba lo aprendido sobre escalas.',
          { q: '¿Qué escala tiene el patrón T S T T S T T?', opts: ['Mayor', 'Menor natural', 'Cromática'], a: 1, why: 'Es la menor natural.' },
          { q: '¿Cuál es la relativa menor de Do mayor?', opts: ['La menor', 'Mi menor', 'Re menor'], a: 0, why: 'La es el sexto grado de Do mayor.' },
          { q: '¿Qué sostenido tiene Sol mayor?', opts: ['Do♯', 'Fa♯', 'Sol♯'], a: 1, why: 'Sol mayor tiene un sostenido: Fa♯.' },
          { q: '¿Cuál es el primer sostenido de una armadura?', opts: ['Do♯', 'Fa♯', 'Si♯'], a: 1, why: 'El orden es Fa, Do, Sol, Re, La, Mi, Si.' },
          { q: '¿Qué escala no tiene semitonos?', opts: ['La pentatónica mayor', 'La mixolidia', 'La menor armónica'], a: 0, why: 'La pentatónica mayor (1-2-3-5-6) evita los semitonos.' },
        ],
      },
    ],
  },
  {
    titulo: 'Acordes',
    lecciones: [
      {
        titulo: 'Las tríadas',
        bloques: [
          'Un <b>acorde</b> son tres o más notas que suenan juntas. La <b>tríada</b> se forma apilando dos terceras sobre una nota llamada <b>fundamental</b>: fundamental, tercera y quinta.',
          'Según el tamaño de las terceras hay cuatro tríadas: <b>mayor</b> (3ª mayor + 3ª menor: Do–Mi–Sol), <b>menor</b> (3ª menor + 3ª mayor: Do–Mi♭–Sol), <b>disminuida</b> (dos menores: Do–Mi♭–Sol♭) y <b>aumentada</b> (dos mayores: Do–Mi–Sol♯).',
          { ej: 'Do4+Mi4+Sol4 Do4+Mib4+Sol4 Do4+Mib4+Solb4 Do4+Mi4+Sol#4', label: 'Mayor, menor, disminuida y aumentada' },
          { ir: { tab: 'chords', set: [['#aType', 'maj'], ['#aRoot', '0']] }, texto: 'Ver los acordes en la pestaña Acordes' },
          { q: '¿Qué notas forman el acorde de Sol mayor?', opts: ['Sol–Si–Re', 'Sol–Si♭–Re', 'Sol–La–Re'], a: 0, why: 'Sol, tercera mayor Si, quinta justa Re.' },
        ],
      },
      {
        titulo: 'Acordes de séptima',
        bloques: [
          'Si a una tríada se le apila otra tercera, aparece la <b>séptima</b> y el acorde tiene cuatro notas. Los más usados son:',
          '<b>Séptima de dominante</b> (Sol7: Sol–Si–Re–Fa): tríada mayor con séptima menor. Es el acorde de tensión que lleva a la tónica. <b>Séptima mayor</b> (Domaj7: Do–Mi–Sol–Si): suave, de jazz y bolero. <b>Séptima menor</b> (Lam7: La–Do–Mi–Sol). <b>Semidisminuido</b> (Sim7♭5: Si–Re–Fa–La). <b>Séptima disminuida</b> (Sidim7: Si–Re–Fa–La♭), con todas sus terceras menores.',
          { ej: 'Sol4+Si4+Re5+Fa5 Do4+Mi4+Sol4+Si4 La4+Do5+Mi5+Sol5', label: 'Sol7, Domaj7 y Lam7' },
          'En el acordeón, muchos de estos acordes no caben completos en una sola dirección del fuelle; en ese caso se omite la quinta, que es la nota menos importante.',
          { ir: { tab: 'chords', set: [['#aType', 'dom7'], ['#aRoot', '7']] }, texto: 'Ver Sol7 en el acordeón' },
          { q: '¿Qué tipo de séptima tiene el acorde de dominante?', opts: ['Séptima menor', 'Séptima mayor', 'Séptima disminuida'], a: 0, why: 'Sol7 = tríada mayor (Sol–Si–Re) + séptima menor (Fa).' },
        ],
      },
      {
        titulo: 'Inversiones y posiciones',
        bloques: [
          'Las notas de un acorde se pueden ordenar de distintas maneras. Si la fundamental está abajo, el acorde está en <b>estado fundamental</b>; si abajo está la tercera, en <b>primera inversión</b>; si está la quinta, en <b>segunda inversión</b>. Sigue siendo el mismo acorde.',
          { ej: 'Do4+Mi4+Sol4 Mi4+Sol4+Do5 Sol4+Do5+Mi5', label: 'Do mayor: fundamental, 1ª y 2ª inversión' },
          'En el acordeón diatónico se elige la posición que cabe en una sola dirección del fuelle y con los dedos cerca. Por eso un mismo acorde puede tener una posición <b>abriendo</b> y otra <b>cerrando</b>.',
          { q: 'Mi–Sol–Do es…', opts: ['Do mayor en primera inversión', 'Mi menor', 'Do mayor en segunda inversión'], a: 0, why: 'Son las notas de Do mayor con la tercera (Mi) abajo.' },
        ],
      },
      {
        titulo: 'Los acordes de los bajos',
        bloques: [
          'La mano izquierda tiene 12 botones: unos dan una sola nota grave (<b>bajo</b>) y otros un <b>acorde</b> completo. En la pantalla los botones de acorde son cuadrados para distinguirlos.',
          'El ritmo básico del acompañamiento alterna bajo y acorde: el bajo en el pulso fuerte y el acorde en el débil («bum-cha»). En Sol-Do-Fa casi todos los acordes son mayores, pero abriendo hay dos menores: <b>La menor</b> y <b>Re menor</b>.',
          { ir: { tab: 'circles', key: '0:maj', type: 1 }, texto: 'Ver el círculo armónico con sus bajos' },
          { q: '¿Qué suena al tocar un botón de acorde de los bajos?', opts: ['Una sola nota grave', 'Tres notas a la vez', 'Una escala'], a: 1, why: 'El botón de acorde da una tríada completa.' },
        ],
      },
      {
        titulo: 'Repaso del capítulo',
        bloques: [
          'Comprueba lo aprendido sobre acordes.',
          { ej: 'La4+Do5+Mi5', label: 'Escucha este acorde' },
          { q: '¿Qué tipo de tríada es La–Do–Mi?', opts: ['Mayor', 'Menor', 'Disminuida'], a: 1, why: 'La–Do es tercera menor y La–Mi quinta justa: tríada menor.' },
          { q: '¿Qué notas forman Fa mayor?', opts: ['Fa–La–Do', 'Fa–La♭–Do', 'Fa–Sol–Do'], a: 0, why: 'Fa, tercera mayor La, quinta justa Do.' },
          { q: '¿Cuántas notas tiene un acorde de séptima?', opts: ['3', '4', '5'], a: 1, why: 'Tríada + séptima = 4 notas.' },
          { q: 'Si abajo está la quinta del acorde, está en…', opts: ['Estado fundamental', 'Primera inversión', 'Segunda inversión'], a: 2, why: 'Quinta abajo = segunda inversión.' },
        ],
      },
    ],
  },
  {
    titulo: 'Funciones armónicas',
    lecciones: [
      {
        titulo: 'Los grados de la escala',
        bloques: [
          'Sobre cada nota de la escala se puede formar una tríada usando solo notas de la escala. Se numeran con <b>números romanos</b>: mayúscula para los acordes mayores, minúscula para los menores.',
          'En una tonalidad mayor resultan siempre: <b>I</b> mayor, <b>ii</b> menor, <b>iii</b> menor, <b>IV</b> mayor, <b>V</b> mayor, <b>vi</b> menor y <b>vii°</b> disminuido. En Do mayor: Do, Rem, Mim, Fa, Sol, Lam, Si°.',
          { ej: 'Do4+Mi4+Sol4 Re4+Fa4+La4 Mi4+Sol4+Si4 Fa4+La4+Do5 Sol4+Si4+Re5 La4+Do5+Mi5 Si4+Re5+Fa5', label: 'Los siete acordes de Do mayor' },
          { q: 'En Sol mayor, ¿cuál es el acorde del grado vi?', opts: ['Mi menor', 'Re mayor', 'Do mayor'], a: 0, why: 'El sexto grado de Sol mayor es Mi, y el vi siempre es menor.' },
        ],
      },
      {
        titulo: 'Tónica, subdominante y dominante',
        bloques: [
          'Cada acorde cumple una <b>función</b>. La <b>tónica</b> (I) es el reposo, «estar en casa». La <b>subdominante</b> (IV, también ii) aleja de casa. La <b>dominante</b> (V, V7) crea tensión y pide volver a la tónica.',
          'Los demás grados reemplazan a estos tres: el vi y el iii suenan parecidos a la tónica, y el vii° funciona como dominante.',
          { ej: 'Do4+Mi4+Sol4 Fa4+La4+Do5 Sol4+Si4+Re5 Do4+Mi4+Sol4', label: 'I – IV – V – I: reposo, alejamiento, tensión, reposo' },
          'Casi toda la música vallenata se arma con estas tres funciones. Con los acordes I, IV y V se acompañan muchísimas canciones.',
          { q: '¿Qué función tiene el acorde de quinto grado (V)?', opts: ['Tónica', 'Subdominante', 'Dominante'], a: 2, why: 'El V es la dominante: genera tensión hacia la tónica.' },
        ],
      },
      {
        titulo: 'La dominante con séptima',
        bloques: [
          'Al acorde de dominante se le agrega casi siempre la <b>séptima</b>: Sol7 en Do mayor. Entre su tercera (Si) y su séptima (Fa) hay un <b>tritono</b>, el intervalo más inestable.',
          'Al resolver, el Si sube a Do y el Fa baja a Mi: las dos notas tensas se mueven medio tono hasta las notas del acorde de Do. Esa es la resolución más fuerte de la música tonal: <b>V7 → I</b>.',
          { ej: 'Sol4+Si4+Re5+Fa5 Do5+Mi5+Sol5', label: 'Sol7 → Do' },
          { q: '¿Qué intervalo hace tan tenso el acorde de séptima de dominante?', opts: ['La octava', 'El tritono', 'La sexta mayor'], a: 1, why: 'Entre la tercera y la séptima del V7 hay 6 semitonos: un tritono.' },
        ],
      },
      {
        titulo: 'Los círculos armónicos',
        bloques: [
          'Un <b>círculo</b> es una vuelta de acordes que se repite y sirve para acompañar canciones. Los tres básicos (los mismos del Sr. Maestro) son:',
          '<b>Triadas I–IV–V</b>: el más sencillo. <b>Círculo armónico I–vi–ii–V7</b>: pasa por la relativa menor y el segundo grado antes de la dominante. <b>Círculo melódico I–vi–IV–V7</b>: muy usado en baladas y paseos.',
          { ej: 'Do4+Mi4+Sol4 La4+Do5+Mi5 Re4+Fa4+La4 Sol4+Si4+Re5+Fa5 Do4+Mi4+Sol4', label: 'Círculo armónico en Do: Do – Lam – Rem – Sol7 – Do' },
          { ir: { tab: 'circles', key: '0:maj', type: 1 }, texto: 'Abrir el círculo armónico de Do' },
          { q: '¿Qué grados tiene el círculo melódico?', opts: ['I–IV–V', 'I–vi–ii–V7', 'I–vi–IV–V7'], a: 2, why: 'Es el que va de la tónica a la relativa, luego a la subdominante y a la dominante.' },
        ],
      },
      {
        titulo: 'La tonalidad menor',
        bloques: [
          'En menor, la tónica es un acorde menor (<b>i</b>) y la subdominante también (<b>iv</b>). Para que la dominante tenga tensión se usa la nota sensible de la menor armónica: así el <b>V7</b> es un acorde mayor con séptima.',
          { ej: 'La4+Do5+Mi5 Re4+Fa4+La4 Mi4+Sol#4+Si4+Re5 La4+Do5+Mi5', label: 'La menor: i – iv – V7 – i' },
          'Otro recorrido muy conocido en menor es el <b>andaluz</b>: i – VII – VI – V7 (Lam – Sol – Fa – Mi7), que baja paso a paso.',
          { q: 'En La menor, ¿por qué el V7 es Mi7 y no Mim7?', opts: ['Porque se usa el Sol♯ de la menor armónica', 'Porque Mi es la tónica', 'Por error'], a: 0, why: 'Con Sol♯ el acorde de Mi es mayor y su tercera resuelve a La.' },
        ],
      },
      {
        titulo: 'Repaso del capítulo',
        bloques: [
          'Comprueba lo aprendido sobre funciones armónicas.',
          { q: 'En Fa mayor, ¿cuál es el acorde de dominante?', opts: ['Do mayor (Do7)', 'Si♭ mayor', 'Re menor'], a: 0, why: 'El quinto grado de Fa mayor es Do.' },
          { q: '¿Qué acorde es el IV en Re mayor?', opts: ['Sol mayor', 'La mayor', 'Mi menor'], a: 0, why: 'Re, Mi, Fa♯, Sol: el cuarto grado es Sol.' },
          { q: 'El ii, en una tonalidad mayor, es un acorde…', opts: ['Mayor', 'Menor', 'Disminuido'], a: 1, why: 'Los grados ii, iii y vi son menores.' },
          { q: '¿Qué función cumple el vi?', opts: ['Parecida a la tónica', 'De dominante', 'De subdominante'], a: 0, why: 'El vi comparte dos notas con el I y suena como su reemplazo.' },
        ],
      },
    ],
  },
  {
    titulo: 'Formas musicales',
    lecciones: [
      {
        titulo: 'Motivo, frase y cadencia',
        bloques: [
          'El <b>motivo</b> es la idea musical más pequeña que se reconoce (unas pocas notas). Varios motivos forman una <b>frase</b>, que suele durar 4 u 8 compases. Muchas veces las frases van de a dos: una «pregunta» que queda abierta y una «respuesta» que cierra.',
          'Al final de cada frase hay una <b>cadencia</b>, un punto de llegada armónico: <b>auténtica</b> (V–I, cierre completo), <b>plagal</b> (IV–I, el «amén»), <b>semicadencia</b> (termina en V, queda abierta) y <b>rota</b> (V–vi, sorprende).',
          { ej: 'Sol4+Si4+Re5 Do4+Mi4+Sol4', label: 'Cadencia auténtica: V – I' },
          { ej: 'Sol4+Si4+Re5 La4+Do5+Mi5', label: 'Cadencia rota: V – vi' },
          { q: '¿Qué cadencia deja la frase abierta, como una pregunta?', opts: ['Auténtica', 'Semicadencia', 'Plagal'], a: 1, why: 'La semicadencia termina en la dominante, que pide continuar.' },
        ],
      },
      {
        titulo: 'Formas de las canciones',
        bloques: [
          'Las secciones de una obra se nombran con letras. <b>Binaria (A B)</b>: dos partes distintas. <b>Ternaria (A B A)</b>: se vuelve a la primera. <b>Rondó (A B A C A)</b>: una parte que regresa entre otras. <b>Estrofa y coro</b>: las estrofas cambian la letra y el coro o estribillo se repite igual.',
          'Reconocer la forma ayuda a memorizar: en vez de recordar cien compases, recuerdas «introducción, A, coro, A, coro, final».',
          { q: '¿Cómo se escribe la forma «parte, otra parte, vuelve la primera»?', opts: ['A B', 'A B A', 'A B C'], a: 1, why: 'Es la forma ternaria.' },
        ],
      },
      {
        titulo: 'Los aires del vallenato',
        bloques: [
          'El vallenato tiene cuatro aires tradicionales: el <b>paseo</b> (2/4, tranquilo, para contar historias), el <b>merengue</b> (6/8, con balanceo), el <b>son</b> (lento y marcado) y la <b>puya</b> (el más rápido, de lucimiento para el acordeonero).',
          'Una canción suele tener: una <b>introducción</b> del acordeón, <b>versos</b> cantados, un <b>estribillo</b> que se repite y <b>pases</b> o adornos del acordeón entre las estrofas, donde aparecen las terceras, sextas y décimas.',
          { ir: { tab: 'solfeo', mode: 'ritmo', set: [['#rLesson', 'paseo']] }, texto: 'Escuchar el ritmo del paseo' },
          { q: '¿Cuál es el aire más rápido del vallenato?', opts: ['Son', 'Paseo', 'Puya'], a: 2, why: 'La puya es el aire de mayor velocidad.' },
        ],
      },
    ],
  },
  {
    titulo: 'El acordeón diatónico',
    lecciones: [
      {
        titulo: 'Hileras y fuelle',
        bloques: [
          'El acordeón Tres Coronas tiene <b>31 pitos en tres hileras</b> (10, 11 y 10 botones). Cada hilera está afinada en una tonalidad mayor; en el Sol-Do-Fa: <b>Sol</b> (afuera), <b>Do</b> (medio) y <b>Fa</b> (adentro).',
          'Es <b>bisonoro</b>: cada pito da una nota <b>cerrando</b> el fuelle (adentro) y otra <b>abriendo</b> (afuera). Cerrando, una hilera da las notas del acorde de su tónica; abriendo, completa la escala con las notas que faltan.',
          { ej: 'Sol3 Do4 Mi4 Sol4 Do5 Mi5', label: 'Hilera de Do cerrando: las notas de Do mayor' },
          { ej: 'Si3 Re4 Fa4 La4 Si4 Re5', label: 'Hilera de Do abriendo: el resto de la escala' },
          { q: 'En la hilera del medio del Sol-Do-Fa, ¿qué acorde dan los pitos cerrando?', opts: ['Do mayor', 'Sol mayor', 'Fa mayor'], a: 0, why: 'Cerrando suenan Sol, Do y Mi: las notas de Do mayor.' },
        ],
      },
      {
        titulo: 'Los tonos del acordeón',
        bloques: [
          'Hay acordeones afinados en distintos tonos: Sol-Do-Fa, Mi-La-Re, Fa-Si♭-Mi♭, La-Re-Sol… Todos tienen <b>los mismos botones con las notas desplazadas</b> la misma distancia. Mi-La-Re está 3 semitonos más bajo que Sol-Do-Fa; La-Re-Sol, 2 más alto.',
          'Por eso una canción aprendida en un acordeón se toca <b>con los mismos dedos</b> en otro tono: solo cambia la altura. Puedes probarlo cambiando arriba el «Tono del acordeón».',
          { q: 'Si una digitación funciona en Sol-Do-Fa, en Mi-La-Re…', opts: ['Hay que cambiarla toda', 'Es igual, pero suena 3 semitonos más grave', 'No se puede tocar'], a: 1, why: 'Los botones son los mismos; todo suena transpuesto.' },
        ],
      },
      {
        titulo: 'Cómo practicar con esta app',
        bloques: [
          'Un orden recomendado: 1) aprende a leer las notas en <b>Solfeo → Lectura</b>; 2) entrena el oído en <b>Solfeo → Oído</b>; 3) toca las <b>Escalas</b> en notas sencillas y luego en terceras y sextas; 4) aprende los <b>Círculos armónicos</b> con sus bajos; 5) practica los aires en <b>Solfeo → Ritmo</b>.',
          'El <b>Camino</b> de la pestaña Solfeo te lleva por estos pasos en orden y guarda tu progreso.',
          { ir: { tab: 'solfeo', mode: 'camino' }, texto: 'Abrir el Camino de Solfeo' },
        ],
      },
    ],
  },
];
