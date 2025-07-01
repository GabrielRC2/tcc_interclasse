<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlayerController extends Controller
{
    public function index(){
        return PlayerResource::collection(Player::all());
    }

    public function store(Request $request){
        try {
        $validated = $request->validate([
            'player_name' => "required|string",
            'jersey_number' => "required|string|min:1"
        ]);

        $player = Player::create($validated);
        return (new PlayerResource($player))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $player = Player::findOrFail($id);
        return new PlayerResource($player);
    }

    public function destroy($id){
        $player = Player::findOrFail($id);
        $player->delete();
        return response()->json(['message' => 'Player deleted successfully'], 200);
    }
}
