<?php

use App\Http\Controllers\FoulController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GerarPartidasController;
use App\Http\Controllers\MatchesController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TournamentController;

Route::post('/gerar-partidas', [GerarPartidasController::class, 'gerar']);

//Player's routes
Route::get('/player', [PlayerController::class, 'index']);
Route::post('/player/new', [PlayerController::class, 'store']);
Route::delete('/player/{id}', [PlayerController::class, 'destroy']);
Route::get('/player/{id}/show', [PlayerController::class, 'show']);
Route::put('/player/{id}/update', [PlayerController::class, 'update']);

//Foul's routes
Route::get('/foul', [FoulController::class, 'index']);
Route::post('/foul/new', [FoulController::class, 'store']);
Route::delete('/foul/{id}', [FoulController::class, 'destroy']);
Route::get('/foul/{id}/show', [FoulController::class, 'show']);
Route::put('/foul/{id}/update', [FoulController::class, 'update']);

//Tournament's routes
Route::get('/tournament', [TournamentController::class, 'index']);
Route::post('/tournament/new', [TournamentController::class, 'store']);
Route::delete('/tournament/{id}', [TournamentController::class, 'destroy']);
Route::get('/tournament/{id}/show', [TournamentController::class, 'show']);
Route::put('/tournament/{id}/update', [TournamentController::class, 'update']);

//Matches' routes
Route::get('/matches', [MatchesController::class, 'index']);
Route::post('/matches/new', [MatchesController::class, 'store']);
Route::delete('/matches/{id}', [MatchesController::class, 'destroy']);
Route::get('/matches/{id}/show', [MatchesController::class, 'show']);
Route::put('/matches/{id}/update', [MatchesController::class, 'update']);

//Report's routes
Route::get('/report', [ReportController::class, 'index']);
Route::post('/report/new', [ReportController::class, 'store']);
Route::delete('/report/{id}', [ReportController::class, 'destroy']);
Route::get('/report/{id}/show', [ReportController::class, 'show']);
Route::put('/report/{id}/update', [ReportController::class, 'update']);

//Team's routes
Route::get('/team', [TeamController::class, 'index']);
Route::post('/team/new', [TeamController::class, 'store']);
Route::delete('/team/{id}', [TeamController::class, 'destroy']);
Route::get('/team/{id}/show', [TeamController::class, 'show']);
Route::put('/team/{id}/update', [TeamController::class, 'update']);

//Player-Team's routes
Route::post('/team/{teamId}/add-player', [TeamController::class, 'addPlayer']);
Route::delete('/team/{teamId}/remove-player', [TeamController::class, 'removePlayer']);