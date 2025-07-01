<?php

use App\Http\Controllers\FoulController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GerarPartidasController;
use App\Http\Controllers\PlayerController;

Route::post('/gerar-partidas', [GerarPartidasController::class, 'gerar']);

Route::get('/player', [PlayerController::class, 'index']);
Route::post('/player/new', [PlayerController::class, 'store']);
Route::delete('/player/{id}', [PlayerController::class, 'destroy']);
Route::get('/player/{id}/show', [PlayerController::class, 'show']);

Route::get('/foul', [FoulController::class, 'index']);
Route::post('/foul/new', [FoulController::class, 'store']);
Route::delete('/foul/{id}', [FoulController::class, 'destroy']);
Route::get('/foul/{id}/show', [FoulController::class, 'show']);
Route::put('/foul/{id}/update', [FoulController::class], 'update');