let rectDifference

function getNumberOfMills(player, nodes) {
    let sum = 0
    let nodesOfPlayer = nodes.flat().filter(n => n.stone === player.color)
    for (const node of nodesOfPlayer) {
        sum += checkForClose(node)
    }
    return sum
}

class GameState {
    constructor(computer, human, nodes){
        this.computer = computer
        this.human = human
        this.nodes = nodes
        this.currentPlayer = human
    }

    switchCurrentPlayer() {
        this.currentPlayer = this.currentPlayer === computer ? this.human : this.computer
    }

    isGameOver() {
        if ((this.human.phase === JUMP_PHASE && this.human.placedStones === 2) ||
            (this.computer.phase === JUMP_PHASE && this.computer.placedStones === 2)) {
            return true
        } else {
            return false
        }
    }

    get otherPlayer() {
        return this.currentPlayer === computer ? this.human : this.computer
    }

    copy() {
        let newComputer = new Computer(this.computer.color);
        newComputer.numberOfUnplacedStones = this.computer.numberOfUnplacedStones
        newComputer.placedStones = this.computer.placedStones
        newComputer.phase = this.computer.phase

        let newHuman = new Human(this.human.color);
        newHuman.numberOfUnplacedStones = this.human.numberOfUnplacedStones
        newHuman.placedStones = this.human.placedStones
        newHuman.phase = this.human.phase
        

        let newNodes = []
        for (let i = 0; i < 3; i++) {
            newNodes[i] = []

            for (let j = 0; j < 8; j++) {
                newNodes[i][j] = new Node(i, j, this.nodes[i][j].stone)
            }
        }

        let newGameState = new GameState(newComputer, newHuman, newNodes)
        newGameState.currentPlayer = this.currentPlayer === this.human ? newHuman : newComputer
        return newGameState
    }
}

function generateTurns(oldGameState) {
    let moveList = []
    switch (oldGameState.currentPlayer.phase) {
        case PLACE_PHASE:
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 8; j++) {
                    let newGameState = oldGameState.copy()
                    newGameState.switchCurrentPlayer()
                    if (newGameState.nodes[i][j].stone === EMPTY) {
                        newGameState.currentPlayer.placeStoneAt(newGameState.nodes[i][j])
                        if (checkForClose(newGameState.nodes[i][j])) {
                            let stoneToRemove = newGameState.nodes.flat().filter(n => n.stone === newGameState.otherPlayer.color)[0]
                            newGameState.otherPlayer.removeStoneAt(stoneToRemove)
                        }
                        moveList.push(newGameState)
                    }
                }
            }
            break;
        case MOVE_PHASE:
            break;
        case JUMP_PHASE:
            break;
        default:
            break;
    }

    return moveList
}

function mill_max(oldGameState, depth, maxDepth) {
    if (depth == 0) //|| keineZuegeMehr(oldGameState))
       return {value: evaluateTurn(oldGameState), turn: null}
    let maxWert = -Infinity;
    let savedTurn
    let states = generateTurns(oldGameState)
    for (state of states) {
       let res = mill_min(state, depth-1, maxDepth)
       if (res.value > maxWert) {
          maxWert = res.value;
          if (depth == maxDepth)
            savedTurn = state;
       }
    }
    return {value: maxWert, turn: savedTurn}
}

function evaluateTurn(state) {
    return getNumberOfMills(state.computer, state.nodes) - getNumberOfMills(state.human, state.nodes)
}

function mill_min(oldGameState, depth, maxDepth) {
    if (depth == 0) //|| keineZuegeMehr(oldGameState))
        return {value: evaluateTurn(oldGameState), turn: null}
    let minValue = Infinity
    let savedTurn
    let states = generateTurns(oldGameState)
    for (state of states) {
        let res = mill_max(state, depth-1, maxDepth)
        if (res.value < minValue) {
            minValue = res.value;
        }
    }
    return {value: minValue, turn: null}
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawField() {
    rectMode(CENTER);
    strokeWeight(5)
    
    fill(255, 241, 193)
    rect(0, 0, rectDifference * 3, rectDifference * 3);
    rect(0, 0, rectDifference * 2, rectDifference * 2);
    rect(0, 0, rectDifference, rectDifference);

    strokeCap(SQUARE)
    angleMode(DEGREES)

    for (let index = 0; index < 4; index++) {
        rotate(90)
        line(0, rectDifference / 2, 0, rectDifference / 2 * 3)
    }
}

function setupNodes() {
    let nodes = []
    for (let i = 0; i < 3; i++) {
        nodes[i] = []
        
        for (let j = 0; j < 8; j++) {
            nodes[i][j] = new Node(i, j)
        }
    }
    return nodes
}


// Enumerations //
const EMPTY = 0
const RED = 1
const BLUE = 2

const PLACE_PHASE = 0
const MOVE_PHASE = 1
const JUMP_PHASE = 2

const RANDOM_MODE = 0
const INFORMED_MODE = 1

class Player {
    constructor(color) {
        this.color = color
        this.numberOfUnplacedStones = 9
        this.placedStones = 0
        this.phase = PLACE_PHASE
    }


    moveStone(from, to) {
        from.stone = EMPTY
        to.stone = this.color
    }

    removeStoneAt(node) {
        // if (checkForClose(node)) {
        //     console.log("Geht nicht")
        //     return false
        // }

        this.placedStones -= 1
        node.stone = EMPTY
        if (this.phase === MOVE_PHASE && this.placedStones === 3) {
            this.phase = JUMP_PHASE
        }

        return true
    }

    placeStoneAt(node) {
        if (this.phase === PLACE_PHASE) {
            node.stone = this.color
            this.numberOfUnplacedStones -= 1
            this.placedStones += 1

            if (this.numberOfUnplacedStones === 0) {
                this.phase = MOVE_PHASE
            }
        } 
    }
}

class Human extends Player {
    constructor(color) {
        super(color)
        this.waitsForTaking = false
        this.selectedNode = null
    }
}

class Computer extends Player {
    constructor(color) {
        super(color)
        this.mode = INFORMED_MODE
    }

    randomMove() {
        switch (this.phase) {
            case PLACE_PHASE: {
                let flat = game.nodes.flat().filter(node => node.stone === EMPTY)
                let i = getRandomInt(0, flat.length - 1)
                this.placeStoneAt(flat[i])
                break;
            }
            case MOVE_PHASE: {
                let flat = game.nodes.flat()
                let ownStones = flat.filter(n => n.stone === this.color && n.hasEmptyNeighbors())
                let i = getRandomInt(0, ownStones.length - 1)
                let possibleTargets = ownStones[i].adjecentNodes.filter(a => a.stone === EMPTY)
                let directionIndex = getRandomInt(0, possibleTargets.length - 1)
                this.moveStone(ownStones[i], possibleTargets[directionIndex])
                break;
            }   
            case JUMP_PHASE: {
                let flat = game.nodes.flat()
                let ownStones = flat.filter(n => n.stone === this.color)
                let emptySpots = flat.filter(n => n.stone === EMPTY)
                let i = getRandomInt(0, ownStones.length - 1)
                let iTraget = getRandomInt(0, emptySpots.length -1)
                this.moveStone(ownStones[i], emptySpots[iTraget])
                break;
            }
            default:
                break;
        }
    }

    informedMove() {
        let gewuenschteTiefe = 2
        let bewertung = mill_max(game, gewuenschteTiefe, gewuenschteTiefe)
        game = bewertung.turn
    }

    makeMove() {
        switch (this.mode) {
            case RANDOM_MODE:
                this.randomMove()
                break;
            case INFORMED_MODE:
                this.informedMove()
                break;
            default: throw "Unimplemented mode"
        }
    }
}

class Node {
    constructor(ring, pos, color) {
        this.adjecentNodes = []
        if (color) {
            this.stone = color
        } else {
            this.stone = EMPTY
        }
        
        this.ring = ring
        this.pos = pos

    }

    hasEmptyNeighbors() {
        return this.adjecentNodes.filter(n => n.stone === EMPTY).length !== 0
    }

    attach(node) {
        if (node !== undefined) {
            this.adjecentNodes.push(node)
        }
    }
}

let nodes = setupNodes()
let computer = new Computer(RED)
let human = new Human(BLUE)
let game = new GameState(computer, human, nodes)

function setup() {
    createCanvas(500, 500)
    edgeDistance = 40;
    rectDifference = width / 3.5

    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].length; j++) {
            if (j % 2 === 0) {
                if (i >= 1) {
                    nodes[i][j].attach(nodes[i - 1][j])
                }
                if(i <= 1){
                    nodes[i][j].attach(nodes[i + 1][j])
                }
            }
            if (j === 7) {
                nodes[i][j].attach(nodes[i][6])
                nodes[i][j].attach(nodes[i][0])
            } else if (j === 0) {
                nodes[i][j].attach(nodes[i][7])
                nodes[i][j].attach(nodes[i][1])
            } else {
                nodes[i][j].attach(nodes[i][j - 1])
                nodes[i][j].attach(nodes[i][j + 1])
            }
        }
    }

    console.log(nodes)

    translate(width/2, height/2)
    drawField();
}

function mouseReleased() {
    let currentNode
    findNodeCoords(function(node, x, y) {
        if (mouseX - width / 2 >= x - 15 &&
            mouseX - width / 2 <= x + 15 &&
            mouseY - height / 2 >= y - 15 &&
            mouseY - height / 2 <= y + 15) {
            console.log(node)
            currentNode = node 
        }
    })

    if (currentNode === undefined) {
        return
    }

    const { phase } = game.human
    const { stone } = currentNode
    if (game.human.waitsForTaking && stone !== EMPTY && stone !== game.human.color) {
        let res = game.computer.removeStoneAt(currentNode)
        if (res === false) {
            return
        } else {
            game.human.waitsForTaking = false
            game.computer.makeMove()
            return
        }
    }

    if ((phase === MOVE_PHASE || phase === JUMP_PHASE) && game.human.selectedNode !== null) {
        if (stone !== EMPTY) {
            return
        }
        game.human.moveStone(game.human.selectedNode, currentNode)
        game.human.selectedNode = null
        if (checkForClose(currentNode) !== 0) {
            game.human.waitsForTaking = true
        } else {
            game.computer.makeMove()
            game.switchCurrentPlayer()
        }

        return
    }

    if (phase === PLACE_PHASE) {
        if (currentNode.stone !== EMPTY) {
            return
        }
        game.human.placeStoneAt(currentNode)
        if (checkForClose(currentNode) !== 0) {
            game.human.waitsForTaking = true
        } else {
            game.computer.makeMove()
            game.switchCurrentPlayer()
        }
        
    } else if (phase === MOVE_PHASE || phase === JUMP_PHASE) {
        if (stone === game.human.color) {
            game.human.selectedNode = currentNode
        }
    }
}

function checkForClose(node) {
    if (node.adjecentNodes.length === 2) {
        let sum = 0
        let d1 = node.adjecentNodes[0]
        let d2 = node.adjecentNodes[1]
        if (d1.ring === node.ring && d1.stone === node.stone) {
            sum += d1.adjecentNodes.filter(n => n.adjecentNodes.length === 2 && n.stone === node.stone && n !== node).length
        }

        if (d2.ring === node.ring && d2.stone === node.stone) {
            sum += d2.adjecentNodes.filter(n => n.adjecentNodes.length === 2 && n.stone === node.stone && n !== node).length
        }
        return sum
    } else if (node.adjecentNodes.length === 3) {
        let sum = Number(node.adjecentNodes.filter(n => n.adjecentNodes.length === 2 && n.stone === node.stone).length === 2) // d1

        let d2 = node.adjecentNodes.filter(n => n.adjecentNodes.length === 4 && n.stone === node.stone)
        if (d2.length === 1) {
            sum += d2[0].adjecentNodes.filter(n => n.adjecentNodes.length === 3 && n !== node && n.stone === node.stone).length
        }
        return sum
    } else {
        let r = node.adjecentNodes.filter(n => n.ring !== node.ring && n.stone === node.stone).length === 2
        let a = node.adjecentNodes.filter(n => n.ring === node.ring && n.stone === node.stone).length === 2
        return r + a
    }
}

function findNodeCoords(action) {
    for (let i = 0; i < game.nodes.length; i++) {
        for (let j = 0; j < game.nodes[i].length; j++) {
            let vLength
            if (j % 2 !== 0) {
                vLength = Math.sqrt(((rectDifference / 2 * (i + 1)) ** 2) * 2) 
            } else {
                vLength = rectDifference / 2 * (i + 1)
            }
            let angle = 45 * j - 90
            let vector = p5.Vector.fromAngle(radians(angle), vLength)

            action(game.nodes[i][j], vector.x, vector.y)
        }
    }
}

function draw() {
    background(255)
    translate(width/2, height/2)

    stroke(0, 0, 0)
    drawField()

    stroke(255, 0, 0)
    ellipseMode(CENTER)
    findNodeCoords(function(node, x, y) {
        if (node.stone !== EMPTY) {
            if (node.stone === BLUE) {
                stroke(0, 0, 255)
            } else {
                stroke(255, 0, 0)
            }
            
            fill(255)
            ellipse(x, y, 30, 30)
        }
    })
}