# FinalProject-Petrinet

## What is the domain about
The domain is a petri net which allow for better views into semantics controls in systems. A Petri net is a directed graph consisting of two kinds of nodes, place and transition, with arcs from a place to a transition or from a transition to a place. Place are shown as circle, and transition as rectangle. A marking assign to each place a string representing tokens. Also, the numbers of inplace and outplace are not NULL. 

## Use-case of the domain
* P is a finite set of places
* T is a finite set of transitions (P ∩ T = ∅)
* F ⊆ (P x T) ∪ (T x P) is a set of arcs (flow relation) to describe an arc that connects a transition t to a place p
* Inplaces of a transition (*t) is a set of places where each element of a set is connected to the transition
* Outplaces of a transition (t*) is a set of places that are connected to the transition by arcs where the places are the destinations and the transition is the source

* The Petri Net could be state machines, free-choice, marked graph, and workflows.
   1) Free-choice petri net
    - if the intersection of the inplaces sets of two transitions are not empty, then the two transitions should be the same (or in short, each transition has its own unique set if inplaces)
   2) State machine
    - a petri net is a state machine if every transition has exactly one inplace and one outplace.
   3) Marked graph
    - a petri net is a marked graph if every place has exactly one out transition and one in transition.
   4) Workflow net
    - a petri net is a workflow net if it has exactly one source place s where s = ∅, one sink place o where o = ∅, and every x ∈ P ∪ T is on a path from s to o.

## How to install
Before you get start, you should make sure the following steps:
  * NodeJS, MongoDB, Python, Docker Destop
After you install these, you could use docker-compose up -d to build the environment. Connect to your server at http://localhost:8888

## Starting the modeling, and feature
I build some exaple you could see:
(1) freechoice
(2) statemachine
(3) markedgraph
(4) workflownet

you could create your own petri nets
Go to the PetriNet, make a petrinet block form the bottom left side. Then, you could create the place and transition, and connect place and transition using arc. 

## Learning curve
This is an interesting final project because it include all the learned knowledge this semester to use. Also, this is my first time to use the Javascript and its library JointJS. To be honest, it is vrey hard to learn and use, so I need to spend a lot of time reading document and search some problems on the web. I also use plenty of print statements and web console to fix my bugs. Although my program still have some bugs, I try my best to write some code to verify my thought. I learn a lot from this course. Thanks for your patient response to all questions.  

