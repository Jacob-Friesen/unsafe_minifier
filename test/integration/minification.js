var _ = require('lodash'),
    fs = require('fs'),
    chai = require('chai'),
    assert = chai.assert;

var Minification = require('../../minification');

// Creates a simple merging function then checks if it was minified correctly by checking all output files.
module.exports = function(){
    describe('Minification Tests', function(){

        // Create the file to be minified and the neural network data from data in this file
        function createTestData(callback){
            fs.writeFile(data.toMergeFile, data.toMerge, function (err) {
                if (err) throw(err);

                if (!fs.existsSync(data.neuralNetworkDir))
                    fs.mkdirSync(data.neuralNetworkDir);

                fs.writeFile(data.neuralNetworkFile, JSON.stringify(data.neuralNetwork), function (err) {
                    if (err) throw(err);
                    callback();
                });
            });
        }

        function createRestOfTestData(callback){
            callback();
        }

        function fileContentsEqual(file, contents, callback){
            fs.readFile(file, 'utf8', function(err, data){
                if (err) throw(err);

                assert.equal(data, contents);

                callback();
            });
        }

        function removeFiles(){
            var callback = _.last(arguments),
                files = Array.prototype.slice.call(arguments);
                files.pop();

            (function remove(files){
                fs.unlink(files[0], function(err){
                    if (err) throw(err);

                    if (files.length > 1)
                        remove(files.slice(1));
                    else
                        callback();
                });
            })(files);
        }

        before(function(done){
            this.timeout(5000);// Once Java is removed (soon) this will be unnecessary

            createTestData(function(){
                var minification = new Minification(data.files);
                    minification.NETWORKS = 1;
                    minification.minifyFile(data.toMergeFile, done);
            });
        });

        // Remove all created files and directories
        after(function(done){
            removeFiles(data.toMergeFile, data.minSafeFile, data.minUnsafeFile, data.minCombinedFile, data.neuralNetworkFile, function(){
                fs.rmdir(data.neuralNetworkDir, function(err){
                    if (err) throw(err);

                    done();
                });
            });
        });

        it('should not alter the original file', function(done){
            fileContentsEqual(data.toMergeFile, data.toMerge, done);
        });

        it('should do the correct safe minification in the safe.min file', function(done){
            fileContentsEqual(data.minSafeFile, data.minSafe, done);
        });

        it('should do the correct unsafe minification in the .min file', function(done){
            fileContentsEqual(data.minUnsafeFile, data.minUnsafe, done);
        });

        it('should do the correct combined minification in the full.min file', function(done){
            fileContentsEqual(data.minCombinedFile, data.minCombined, done);
        });
    });
}

var data = {};

data.toMergeFile = 'toMerge.js';
data.toMerge = 
'function function1(x, y){\n\
    x + y;\n\
}\n\
function function2(w, z){\n\
    return w * z;\n\
}\n\
function1(1,2);\n\
var x = function2(3, 4);';

data.minSafeFile = data.toMergeFile.replace('js', 'safe.min.js');
data.minSafe = 'function function1(a,b){a+b}function function2(a,b){return a*b}function1(1,2);var x=function2(3,4);\n';

data.minUnsafeFile = data.toMergeFile.replace('js', 'min.js');
data.minUnsafe =
'function function2(x, y, w, z) {\n\
    {\n\
        x + y;\n\
    }\n\
    return w * z;\n\
}\n\
var x = function2(1, 2, 3, 4);';

data.minCombinedFile = data.toMergeFile.replace('js', 'full.min.js');
data.minCombined ='function function2(a,b,c,d){a+b;return c*d}var x=function2(1,2,3,4);\n';

// Just the data I obtained from a normal run, any non extreme outlier results will work
data.neuralNetworkFile = 'data/test_network/neuralNetwork0.json';
data.neuralNetworkDir = data.neuralNetworkFile.split('/').slice(0, -1).join('/');
data.neuralNetwork = {"layerSizes":[10,40,1],"weights":{"0":{"11":0.38970295635761815,"12":-0.5990543333094904,"13":0.2782669931223794,
"14":0.3712996915757368,"15":0.5288533561900515,"16":-0.3089089615536821,"17":0.21017430691489586,"18":-0.5918848781922132,"19":0.28385006333100443,
"20":-0.3051894872161419,"21":-0.25798154707416693,"22":-0.539187361081098,"23":0.23093896433428923,"24":-0.6205216444715048,
"25":0.20693396526658042,"26":-0.6116340204366587,"27":0.3020592172023791,"28":-0.29287317020075754,"29":-0.17208522962351963,
"30":-0.6249483848336536,"31":-0.5625262812137486,"32":-0.2931922527748431,"33":0.567611197404706,"34":-0.6822037905950354,"35":-0.6519911951104421,
"36":-0.676240772342141,"37":0.2126425683537762,"38":0.4488374810887255,"39":-0.652502938060103,"40":-0.6286841332883696,"41":0.19316883626640644,
"42":-0.5285805283070126,"43":0.518210639742896,"44":-0.6188317560956581,"45":0.5112434152721135,"46":-0.5362502342257376,"47":0.46822684568725853,
"48":-0.6092724707781584,"49":-0.2499585103107516,"50":0.39085264410452575},"1":{"11":0.5347842792970336,"12":-0.5856278836801769,
"13":0.16805991296740794,"14":0.5502658333132298,"15":0.43785026022044765,"16":-0.23640630074642033,"17":0.23934408215009845,
"18":-0.6139843784847455,"19":0.1712172453677497,"20":-0.2676773459360848,"21":-0.29609069602890337,"22":-0.557908950061081,"23":0.18988743148757717,
"24":-0.6908800017014584,"25":0.17031924745725016,"26":-0.6142481905090976,"27":0.2084936090166168,"28":-0.24468684103437005,
"29":-0.2595471807185635,"30":-0.5796653866885351,"31":-0.6036127625925196,"32":-0.1669096186352959,"33":0.4207784675758606,"34":-0.5306296742782386,
"35":-0.5844822183155292,"36":-0.5663054441091175,"37":0.20650403258019284,"38":0.4122498588062559,"39":-0.6594410430537757,"40":-0.6080773548848969,
"41":0.1872589353454208,"42":-0.6924805700943396,"43":0.4634713475200492,"44":-0.6738281493254167,"45":0.39062952473056173,"46":-0.669812261643785,
"47":0.49078845250884934,"48":-0.6185771845608966,"49":-0.2760626952192338,"50":0.5466182424577566},"2":{"11":0.39519301239909804,
"12":-0.6417476638275473,"13":0.33520748686535934,"14":0.3712468587628787,"15":0.5492402567809616,"16":-0.26055851751471815,"17":0.3528596991186052,
"18":-0.5548320102647684,"19":0.1703654590321654,"20":-0.21243281698318028,"21":-0.12785729480140828,"22":-0.6518059935112136,
"23":0.2744213904186054,"24":-0.5621643294883856,"25":0.292846740863747,"26":-0.5444627848913628,"27":0.16031158032541395,"28":-0.2912347571419638,
"29":-0.22022491750274953,"30":-0.5475684477007594,"31":-0.623163560133971,"32":-0.2537512992006483,"33":0.5200117620290836,"34":-0.6692287921399135,
"35":-0.72540476484638,"36":-0.5547364992217634,"37":0.25560062750387674,"38":0.568486786483007,"39":-0.5532556858752462,"40":-0.681570387578656,
"41":0.30854342331983337,"42":-0.7018753014206622,"43":0.5671304730851776,"44":-0.6492326251470381,"45":0.48193251141653787,"46":-0.6567254657350242,
"47":0.43728483434667004,"48":-0.6001357459837,"49":-0.2125419319483675,"50":0.4939302605998313},"3":{"11":0.5230999028421681,
"12":-0.607578590381168,"13":0.19785017545106823,"14":0.5017400060502943,"15":0.39861276691796094,"16":-0.14000509420981133,"17":0.20314707276625596,
"18":-0.05306949767765135,"19":0.25119958084182864,"20":-0.2007296752163469,"21":-0.23976219233334828,"22":-0.6183835347482035,
"23":0.1865402351008644,"24":-0.5795625071143424,"25":0.1905058455188207,"26":-0.6477633293738404,"27":0.16473840618297617,"28":-0.2481778048508782,
"29":-0.2981595221502757,"30":-0.5661590996165875,"31":-0.6903596082550666,"32":-0.2164946747477799,"33":0.4219436566284602,"34":-0.623145141553403,
"35":-0.638763440733945,"36":-0.563190189608382,"37":0.22360386948996142,"38":0.5250811603327026,"39":-0.528590170569168,"40":-0.6115475382867525,
"41":0.21813977630080988,"42":-0.6405748700603514,"43":0.4877861680900237,"44":-0.6105307895750361,"45":0.4511656738454706,"46":-0.5810364723527341,
"47":0.5326507803656035,"48":-0.6159578912828986,"49":-0.2189995621238333,"50":0.5101328567643646},"4":{"11":-3.0958296180932487,
"12":1.3993817533828823,"13":1.2198453112291836,"14":-3.1086715307367396,"15":-3.1706212616724283,"16":3.0956566393579363,"17":1.1343603338201638,
"18":1.292348716070061,"19":1.1885704012370413,"20":3.1799513864988613,"21":3.0710833266644997,"22":1.3799488881032247,"23":1.1237634573502109,
"24":1.4499400256747255,"25":1.1580601921198044,"26":1.2903940917978545,"27":1.1984739964223747,"28":3.0895506535882173,"29":3.066229191842546,
"30":1.397064525273236,"31":1.4492497895355734,"32":3.1525922558576527,"33":-3.1214612340878456,"34":1.4555619486128326,"35":1.4008589065384944,
"36":1.4238852059857077,"37":1.1065651814123514,"38":-3.0641739298758814,"39":1.437424267603396,"40":1.2683823094271711,"41":1.1122611871508186,
"42":1.2969742557137591,"43":-3.1266739409586206,"44":1.2827188270008634,"45":-3.1096687421631946,"46":1.2788295950934474,"47":-3.1534279104752847,
"48":1.3625067140531293,"49":3.149729741632073,"50":-3.1549315247408103},"5":{"11":-3.0846024441952196,"12":1.3376938486123904,
"13":1.1968382891350973,"14":-3.022069989838185,"15":-3.1311494431363283,"16":3.1823922760874694,"17":1.1323942337910216,"18":1.2861537896450672,
"19":1.1487382511043531,"20":3.1706440293432205,"21":3.0560018929535753,"22":1.4515063181367212,"23":1.1918051158342773,"24":1.3306136268650781,
"25":1.072629787141106,"26":1.3418601452645924,"27":1.0867237070082925,"28":3.087209431535327,"29":3.0917403337166083,"30":1.322266897108235,
"31":1.3269930838527488,"32":3.0282705100660423,"33":-3.1019921760291504,"34":1.2788957360404338,"35":1.3441781141482256,"36":1.3918472023951836,
"37":1.0450710166997115,"38":-3.190071818635374,"39":1.355940096131142,"40":1.4375099662316084,"41":1.0362353883118485,"42":1.4078566964578378,
"43":-3.059828993816542,"44":1.3323583695825936,"45":-3.0217281761942854,"46":1.2988933830911669,"47":-3.0957625460099383,"48":1.2792929710151943,
"49":3.115008743322952,"50":-3.091671137472738},"6":{"11":-3.0900387438312307,"12":1.4434042918998886,"13":1.0342960131431767,"14":-3.190619484839315,
"15":-3.102224744043304,"16":3.161802933719234,"17":1.1498618054737664,"18":1.309407108845245,"19":1.1722771800271992,"20":3.078325803712576,
"21":3.1623477002502955,"22":1.385082401634068,"23":1.1390616242629776,"24":1.3873218443772717,"25":1.0364705676614077,"26":1.2680094587129518,
"27":1.2111492539177968,"28":3.074390224909073,"29":3.208843284410319,"30":1.3096361091488264,"31":1.4606109779601189,"32":3.2068688006152355,
"33":-3.018367188410153,"34":1.2974026058968042,"35":1.3754520220372626,"36":1.3712846627459867,"37":1.1108790062680938,"38":-3.1606334847971147,
"39":1.4638741808771463,"40":1.461730525314095,"41":1.1909663182823056,"42":1.3515775438256439,"43":-3.059915981767746,"44":1.4076594508086306,
"45":-3.0274739398909523,"46":1.368025522910016,"47":-3.1326511469798284,"48":1.3686557493713107,"49":3.1296819922200463,"50":-3.070534236188924},
"7":{"11":-3.0244182313625574,"12":1.3714861138754748,"13":1.1451838666410075,"14":-3.1061011988567317,"15":-3.167572038595143,
"16":3.122822569828998,"17":1.0853099193652207,"18":1.3260922768870578,"19":1.1377316506237283,"20":3.061833503265614,"21":3.1143056322078078,
"22":1.377124506322237,"23":1.1207422721119809,"24":1.323753583654392,"25":1.0806772617161111,"26":1.4541983402583,"27":1.10425468676502,
"28":3.171684319841064,"29":3.171363219090929,"30":1.4298718757345306,"31":1.4225438832493948,"32":3.0911105518687174,"33":-3.0619741369811635,
"34":1.3868118492407127,"35":1.2933172085812514,"36":1.3836151369823035,"37":1.153499692786058,"38":-3.157943768537133,"39":1.3841513498741833,
"40":1.4249163467979131,"41":1.2160103366856572,"42":1.3482151232017094,"43":-3.052938989678787,"44":1.318828430362792,"45":-3.129129121506084,
"46":1.2697837613300293,"47":-3.0167027778538307,"48":1.299387549469012,"49":3.1565697184731345,"50":-3.1301951179974865},
"8":{"11":3.106624643688452,"12":3.098146620636564,"13":3.1911494377532836,"14":3.091164510557453,"15":3.038926347265221,"16":3.0655273770353126,
"17":3.1683968887531613,"18":3.0914512995207826,"19":3.0249936092563834,"20":3.0969711670120557,"21":3.188412027345958,"22":3.1904145029727617,
"23":3.137300463848004,"24":3.190860625584763,"25":3.2119094396773216,"26":3.1963442134977336,"27":3.097322884619758,"28":3.172498259089297,
"29":3.1127048823001537,"30":3.1586732864660836,"31":3.1420754233045516,"32":3.035743135645319,"33":3.156002528208713,"34":3.0317249146280747,
"35":3.113269489448244,"36":3.213992027300659,"37":3.0948057364749593,"38":3.117276319831438,"39":3.2136800897403397,"40":3.051281981646927,
"41":3.0397179132577787,"42":3.120344517861406,"43":3.1705896711170944,"44":3.1336822071394974,"45":3.2061413165085533,"46":3.038022961281018,
"47":3.01831703864454,"48":3.2068876592457265,"49":3.1686105683345005,"50":3.158485262307486},"9":{"11":0.37146894911851475,"12":-0.7225314249270314,
"13":0.18450737442268542,"14":0.5198482056706635,"15":0.40264217805550323,"16":-0.16149734069594235,"17":0.2392235636986086,"18":-0.6823583424610088,
"19":0.3545170651508684,"20":-0.1136797753208592,"21":-0.2368450321029626,"22":-0.6029635753346458,"23":0.3211456924120693,"24":-0.6197999545883072,
"25":0.23947511020447027,"26":-0.6204466206628018,"27":0.1901487944129183,"28":-0.13736449636880782,"29":-0.17214029407156428,
"30":-0.666093550804503,"31":-0.5943307443962049,"32":-0.21820028803987218,"33":0.5286285512153346,"34":-0.6786461366306106,"35":-0.6193504835922033,
"36":-0.578853562660165,"37":0.3138754813223657,"38":0.47264776677334513,"39":-0.6743397805163668,"40":-0.6518456966313514,"41":0.1934510473135523,
"42":-0.5450410242738419,"43":0.5598527864553207,"44":-0.5888555152897306,"45":0.5057794556346211,"46":-0.7187406710701227,"47":0.3936350239818304,
"48":-0.6355289226457753,"49":-0.29669113106384054,"50":0.4297153139652861},"10":{"11":0.4520476061619219,"12":-0.5855903688887254,
"13":0.24047654787969958,"14":0.41779293830232794,"15":0.42708780632892523,"16":-0.22151156582891768,"17":0.283668584507559,"18":-0.5931705135188019,
"19":0.3491413109826,"20":-0.1522715759672209,"21":-0.19751991512847297,"22":-0.5734093293664195,"23":0.26471719130633614,"24":-0.7020898041980377,
"25":0.24263027141246157,"26":-0.7046160993276391,"27":0.24663951252417587,"28":-0.24268457439635538,"29":-0.3031859674835844,"30":-0.6976714580326435,
"31":-0.7198597902019728,"32":-0.2886755386412718,"33":0.4439351213586851,"34":-0.6629542621273873,"35":-0.6483180238036953,"36":-0.6149489750872835,
"37":0.2240051415618784,"38":0.385272808192986,"39":-0.5602011443126809,"40":-0.7252474973368708,"41":0.2115569607232311,"42":-0.5277966665874361,
"43":0.5609198776232935,"44":-0.6415865746357964,"45":0.5493849846837424,"46":-0.6719788228996358,"47":0.3889695026594084,"48":-0.6383591469858897,
"49":-0.24724179798916157,"50":0.5607497212610855},"11":{"52":-0.24177118749766807},"12":{"52":2.945482195931589},"13":{"52":0.24376482414285133},
"14":{"52":-0.2304126513867225},"15":{"52":-0.23949782812783343},"16":{"52":3.1329192505386683},"17":{"52":0.22943228620371198},
"18":{"52":2.9362552327769604},"19":{"52":0.1624394367458096},"20":{"52":3.147833680693743},"21":{"52":3.2108511437336102},
"22":{"52":2.8782573964852025},"23":{"52":0.18179139691461768},"24":{"52":2.9055381135828835},"25":{"52":0.16052208251347813},
"26":{"52":2.9141319321631505},"27":{"52":0.2293637748544734},"28":{"52":3.1717912069894876},"29":{"52":3.1680994072751933},
"30":{"52":2.9104818685530724},"31":{"52":2.9537452207424844},"32":{"52":3.145819029514211},"33":{"52":-0.25018782670521955},
"34":{"52":2.8949794572881107},"35":{"52":2.965930250330156},"36":{"52":2.9588851302243366},"37":{"52":0.22178667816383207},
"38":{"52":-0.2349234476171697},"39":{"52":2.902327633862045},"40":{"52":2.900304673515511},"41":{"52":0.22492769043966215},
"42":{"52":2.971215039520371},"43":{"52":-0.2149572116559078},"44":{"52":2.929052369348921},"45":{"52":-0.234240357423107},
"46":{"52":2.941904888918505},"47":{"52":-0.23877247442157257},"48":{"52":2.923551820561498},"49":{"52":3.143117389251732},
"50":{"52":-0.2336744816273868},"51":{"52":-0.22935859305392076}}}

data.files = {
    neuralNetwork: [data.neuralNetworkFile.replace('0', ''), true]// number is automatically found in Training (used by Minification)
}
