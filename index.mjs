import R from 'ramda';

function Tournament(){
    return {
        tally: (list) => {
            const extractData = (res, value) => {
                const init = (key, res) => 
                    R.cond([
                        [R.propEq(key, undefined), R.assoc(key, {'mp': 0, 'w': 0, 'l': 0, 'd': 0,'p': 0})],
                        [R.T, R.always(res)]
                    ])(res);
                const curriedInit = R.curry(init);

                const addPoints = (key, nbPoints, team, acc) => {
                    const teamStruct = R.prop(team, acc);
                    return R.assoc(team, R.assoc(key, R.add(nbPoints, R.prop(key, teamStruct)), teamStruct), acc);
                }
                const curriedAddPoints = R.curry(addPoints);
                const addWin = curriedAddPoints('w', 1);
                const addLose = curriedAddPoints('l', 1);
                const addDraw = curriedAddPoints('d', 1);
                const addPlayed = curriedAddPoints('mp', 1);
                const addP = curriedAddPoints('p');

                const win = (team1, team2) =>
                    R.pipe(
                        addWin(team1),
                        addLose(team2),
                        addP(3, team1)
                    );

                const draw = (team1, team2) =>
                    R.pipe(
                        addDraw(team1),
                        addDraw(team2),
                        addP(1, team1),
                        addP(1, team2)
                    );

                const team1 = R.view(R.lensIndex(0), value);
                const team2 = R.view(R.lensIndex(1), value);

                return R.pipe(
                    curriedInit(team1),
                    curriedInit(team2),
                    R.cond([
                        [R.equals('win'), () => win(team1, team2)],
                        [R.equals('loss'), () => win(team2, team1)],
                        [R.equals('draw'), () => draw(team1, team2)],
                        [R.T, R.identity]
                    ])(R.view(R.lensIndex(2), value)),
                    addPlayed(team1),
                    addPlayed(team2)
                )(res);
            };
            const curriedExtractData = R.curry(extractData);

            const format = (body) => {
                return R.pipe(
                    R.concat(body),
                    R.concat("\n"),
                    R.concat("| MP |  W |  D |  L |  P"),
                    R.concat(R.slice(0,31, R.concat("Team", "                                          ")))
                )("");
            };

            const formatBody = 
                R.reduce( (acc, value) => {
                    const name = R.nth(0, value);
                    const data = R.nth(1, value);
                    return R.concat(
                        R.concat(acc, "\n"),
                        R.pipe(
                            R.always(["mp", "w", "d", "l", "p"]),
                            R.reduce((acc, value) => {
                                return R.concat(
                                    acc,
                                    R.concat(
                                        R.pipe(
                                            R.prop(value),
                                            R.toString(),
                                            R.concat("|  "),
                                        )(data),
                                        " "
                                    )
                                )
                            }, ""),
                            R.concat(R.slice(0,31, R.concat(name, "                   ")))
                        )(data)
                    );
                }, "");

            const compute = R.reduce((acc, value) => {             
                    return R.pipe(
                        R.match(/^\w+\s\w+;\w+\s\w+;(loss|win|draw)$/g),
                        R.ifElse(
                          R.equals([]),
                          R.always(acc),
                          R.pipe(
                            R.view(R.lensIndex(0)),
                            R.split(';'),
                            R.map(R.trim),
                            curriedExtractData(acc)
                            )
                        )
                    )(value);
                }, {});

            const sort = R.pipe(
                R.toPairs,
                R.sortWith([
                    R.descend(R.pipe(R.nth(1), R.prop('p'))),
                    R.ascend(R.nth(0))
                ])
            );

            return R.pipe(
                compute,
                sort,
                formatBody,
                format
            )(list);
        }
    };
}

const t = new Tournament();
console.log(t.tally([
      "Allegoric Alaskans;Blithering Badgers;win",
      "Devastating Donkeys;Courageous Californians;draw",
      "Devastating Donkeys;Allegoric Alaskans;win",
      "Courageous Californians;Blithering Badgers;loss",
      "Blithering Badgers;Devastating Donkeys;loss",
      "Allegoric Alaskans;Courageous Californians;win"
    ]));