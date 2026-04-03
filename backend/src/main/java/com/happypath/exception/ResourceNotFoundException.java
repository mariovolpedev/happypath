package com.happypath.exception;
import org.springframework.http.HttpStatus;
public class ResourceNotFoundException extends HappyPathException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " non trovato con id: " + id, HttpStatus.NOT_FOUND);
    }
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
