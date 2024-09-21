var day = 1
var seats = []
var players = []
var nominations = []

var currentNomination = {
    plaintiff: undefined,
    defendant: undefined,
    votes: [],
}

var currentClick
var nominating = false

var currentPlayerId = 0


function NewGame() {
    day = 1
    seats = []
}

class Nomination {
    constructor(day, plaintiff, defendant, votes) {
        this.day = day
        this.plaintiff = plaintiff
        this.defendant = defendant
        this.votes = votes
    }
}

class Player {
    constructor(number, seat) {
        this.playerId = number
        this.seat = seat
    }

    name = ""
    votes = []
}

{
    const DAYCOUNTER = document.getElementById("day-counter")
    const DAYBACK = document.getElementById("day-back")
    const DAYFORWARD = document.getElementById("day-forward")


    DAYBACK.addEventListener("click", () => {
        if (nominating) return

        DAYCOUNTER.innerHTML = `DAY ${--day}`
        if (day == 1) DAYBACK.classList.add("hidden")
    })

    DAYFORWARD.addEventListener("click", () => {
        if (nominating) return

        DAYBACK.classList.remove("hidden")
        DAYCOUNTER.innerHTML = `DAY ${++day}`
    })
}

{
    const SEATINGAREASIZE = 40
    var seatDiameter = 16


    function GetSeatVector(number, total) {
        let angle = ((total-(number-1)) / total) * (2*Math.PI)
        let vector = [Math.round(Math.sin(angle)*(10**4))/10**4, Math.round(Math.cos(angle)*(10**5))/10**5]

        return vector
    }

    function GetSeatTranslate(vector, areaRadius, unit, diameter) {
        let height = areaRadius-diameter/2
        return `translate(${(areaRadius-(vector[0]*height))+unit+", "+(areaRadius-(vector[1]*height))+unit})`
    }

    function CreateSeatElement(vector, areaRadius, unit, diameter) {
        let seat = document.createElement("seat")
        seat.style.transform = GetSeatTranslate(vector, areaRadius, unit, diameter)
        let nametag = document.createElement("input")
        nametag.classList.add("nametag")
        nametag.type = "text"
        nametag.maxLength = 15
        nametag.autocomplete = "off"
        nametag.autocorrect = "off"
        nametag.autocapitalize = "off"
        nametag.spellcheck = "false"
        seat.appendChild(nametag)
        nametag.addEventListener("input", ChangePlayerName)
        nametag.addEventListener("click", (event) => {event.stopPropagation()})
        console.log(seat)
        document.getElementById("seats").appendChild(seat)
        
        return seat
    }

    function RepositionSeat(seat, seatNumber, totalSeats) {
        let vector = GetSeatVector(seatNumber, totalSeats)
        seat.style.transform = GetSeatTranslate(vector, SEATINGAREASIZE, "dvmin", seatDiameter)
    }

    function AddSeat() {
        if (nominating) return

        let totalSeats = seats.length+1
        document.getElementById("seat-counter").innerHTML = totalSeats
        let size = ["large", "medium", "small", "tiny"][Math.floor((totalSeats-1)/5)]
        seatDiameter = [18, 15, 12, 10][Math.floor((totalSeats-1)/5)]
        if (size == undefined) {size = "tiny"; seatDiameter = 10}

        seats.forEach((seat, i) => {
            seat.classList.remove("large", "medium", "small")
            seat.classList.add(size)
            RepositionSeat(seat, i+1, totalSeats)
        })

        let vector = GetSeatVector(totalSeats, totalSeats)
        let seat = CreateSeatElement(vector, SEATINGAREASIZE, "dvmin", seatDiameter)
        seat.classList.add(size)
        seat.addEventListener("click", SelectSeat)
        seats.push(seat)
        players.push(new Player(currentPlayerId++, seat))
    }

    document.getElementById("seat-add").addEventListener("click", AddSeat)

    function ChangePlayerName(event) {
        seatNumber = seats.indexOf(event.target.parentElement)
        console.log(event.target)
        players[seatNumber].name = event.target.value
        console.log(players[seatNumber])
    }
}

// CreateSeatElement(vector, SEATINGAREASIZE, "dvmin", seatDiameter)

{
    function SelectSeat(event) {
        event.stopPropagation()
        if (currentClick == undefined) {
            currentClick = this
            this.classList.add("selected")
        } else {
            StartNomination(players[seats.indexOf(currentClick)], players[seats.indexOf(this)])
            currentClick.classList.remove("selected")
            currentClick = undefined
            nominating = true
        }

    }

    function RaiseHand(event) {
        document.getElementById("submit-nomination").removeEventListener("click", DeleteNomination)
        document.getElementById("submit-nomination").addEventListener("click", EndNomination)
        document.getElementById("submit-nomination").innerHTML = "SUBMIT"
        var player = players.find(player => player.seat == this)
        if (currentNomination.votes.includes(player)) {
            this.classList.remove("voting")
            currentNomination.votes.splice(currentNomination.votes.indexOf(player), 1)
        } else {
            this.classList.add("voting")
            currentNomination.votes.push(player)
        }



    }

    function StartNomination(plaintiff, defendant) {
        document.getElementById("nomination-menu").classList.remove("hidden")
        document.getElementById("nomination-text").innerHTML = `${plaintiff.name} NOMINATES ${defendant.name}`
        let oldNomination = nominations.find(nom => (nom.plaintiff == plaintiff && nom.defendant == defendant && nom.day == day))
        console.log(oldNomination)
        if (oldNomination == undefined) {
            currentNomination = {
                plaintiff: plaintiff,
                defendant: defendant,
                votes: [],
            }
            document.getElementById("submit-nomination").removeEventListener("click", DeleteNomination)
            document.getElementById("submit-nomination").addEventListener("click", EndNomination)
            document.getElementById("submit-nomination").innerHTML = "SUBMIT"
        } else {
            currentNomination = {
                plaintiff: oldNomination.plaintiff,
                defendant: oldNomination.defendant,
                votes: [...oldNomination.votes],
            }
            currentNomination.votes.forEach(voter => voter.seat.classList.add("voting"))
            document.getElementById("submit-nomination").removeEventListener("click", EndNomination)
            document.getElementById("submit-nomination").addEventListener("click", DeleteNomination)
            document.getElementById("submit-nomination").innerHTML = "DELETE"
            
        }

        console.log(plaintiff.name, "NOMINATES", defendant.name)
        seats.forEach(seat => {
            seat.removeEventListener("click", SelectSeat)
            seat.addEventListener("click", RaiseHand)
        })
    }

    function EndNomination() {
        let index = nominations.indexOf(nominations.find(nomination => (nomination.day == day && nomination.plaintiff == currentNomination.plaintiff && nomination.defendant == currentNomination.defendant)))
        console.log(index)
        if (index != -1) nominations.splice(index, 1)
        nominations.push(new Nomination(day, currentNomination.plaintiff, currentNomination.defendant, currentNomination.votes))
        CancelNomination()
    }

    function CancelNomination() {
        document.getElementById("nomination-menu").classList.add("hidden")
        currentNomination.votes.forEach(player => player.seat.classList.remove("voting"))
        seats.forEach(seat => {
            seat.removeEventListener("click", RaiseHand)
            seat.addEventListener("click", SelectSeat)
        })
        nominating = false
    }

    function DeleteNomination() {
        nominations.splice(nominations.indexOf(nominations.find(nom => (nom.plaintiff == currentNomination.plaintiff && nom.defendant == currentNomination.defendant && nom.day == day))), 1)
        CancelNomination()
    }

    document.addEventListener("click", () => {
        if (currentClick != undefined) {
            currentClick.classList.remove("selected")
            currentClick = undefined
        }
    })

    document.getElementById("cancel-nomination").addEventListener("click", CancelNomination)
    document.getElementById("submit-nomination").addEventListener("click", EndNomination)
}

document.getElementById("show-all").addEventListener("click", () => {
    document.getElementById("nomination-list").classList.remove("hidden")
    nominations.sort((a, b) => {
        return a.day-b.day
    })

    let string = ``
    // let maxDay = nominations[nominations.length-1].day

    nominations.forEach(nom => {
        string += `${nom.day}: ${nom.plaintiff.name} -> ${nom.defendant.name} (${nom.votes.length}) [`
        nom.votes.forEach(vote => string += `${vote.name}, `)
        string += `]</br>`
    })
    string += "</br></br>VOTERS:"

    let day
    let voters = []
    nominations.forEach(nom => {
        if (nom.day != day) {
            day = nom.day
            console.log(new Set(voters))
            new Set(voters).forEach(vote => string += `${vote.name}, `)
            voters = []
            string += `</br>${nom.day}: `
        }
        voters.push(...nom.votes)
    })
    new Set(voters).forEach(vote => string += `${vote.name}, `)

    string += "</br></br>NOMINATORS:"

    day = undefined
    let nominators = []
    nominations.forEach(nom => {
        if (nom.day != day) {
            day = nom.day
            console.log(new Set(nominators))
            new Set(nominators).forEach(nominator => string += `${nominator.name}, `)
            nominators = []
            string += `</br>${nom.day}: `
        }
        nominators.push(nom.plaintiff)
    })
    new Set(nominators).forEach(nominator => string += `${nominator.name}, `)
    
    document.getElementById("nomination-list").innerHTML = string
})
document.getElementById("nomination-list").addEventListener("click", () => document.getElementById("nomination-list").classList.add("hidden"))