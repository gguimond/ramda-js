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
                return R.pipe(
                    curriedInit(R.view(R.lensIndex(0), value)),
                    curriedInit(R.view(R.lensIndex(1), value))
                )(res);
            };
            const curriedExtractData = R.curry(extractData);

            return R.reduce((acc, value) => {             
                const result = R.pipe(
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
                );
                return result(value);
            }, {}, list);
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