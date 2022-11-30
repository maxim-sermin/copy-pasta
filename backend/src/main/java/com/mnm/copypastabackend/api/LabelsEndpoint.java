package com.mnm.copypastabackend.api;

import java.util.List;

import com.mnm.copypastabackend.entities.Label;
import com.mnm.copypastabackend.repositories.LabelRepository;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/labels")
@Api(value = "Endpoint for interacting with labels")
public class LabelsEndpoint {

    @Autowired
    private LabelRepository labelRepository;

    @GetMapping("/")
    public ResponseEntity<List<Label>> getAllLabels() {
        return ResponseEntity.ok(labelRepository.findAllByOrderByName());
    }

    @GetMapping("/names")
    public ResponseEntity<List<String>> getAllLabelNames() {
        return ResponseEntity.ok(labelRepository.getLabelNames());
    }
}
