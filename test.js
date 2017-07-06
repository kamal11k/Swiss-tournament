var swiss = require ('./controller/swisstourney.js');
swiss.playerStandings(9,function(error,x){
        if(error)
            console.log('Error');
        else{
            console.log(x)
        }

    })
