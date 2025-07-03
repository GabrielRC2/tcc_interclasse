<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return[
            'id' => $this->id,
            'player_name' => $this->player_name,
            'jersey_number' => $this->jersey_number,
            // Adiciona os times associados se eles foram carregados
            'teams' => TeamResource::collection($this->whenLoaded('teams')),
        ];
    }
}
